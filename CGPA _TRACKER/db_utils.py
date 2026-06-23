import sqlite3
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
PRIMARY_DB_PATH = PROJECT_DIR / "database.db"
FALLBACK_DB_PATH = PROJECT_DIR / "database_runtime.db"

DEFAULT_PRAGMAS = {
    "journal_mode": "WAL",
    "synchronous": "NORMAL",
    "temp_store": "MEMORY",
}

SAFE_PRAGMAS = {
    "journal_mode": "MEMORY",
    "synchronous": "OFF",
    "temp_store": "MEMORY",
}


def ensure_schema(conn):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS semesters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            semester_number INTEGER,
            sgpa REAL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            semester_id INTEGER,
            name TEXT,
            credits INTEGER,
            grade TEXT,
            grade_points INTEGER,
            FOREIGN KEY (semester_id) REFERENCES semesters(id)
        )
        """
    )


def _apply_pragmas(conn, pragmas):
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute(f"PRAGMA temp_store = {pragmas['temp_store']}")
    conn.execute(f"PRAGMA journal_mode = {pragmas['journal_mode']}")
    conn.execute(f"PRAGMA synchronous = {pragmas['synchronous']}")


def _cleanup_sidecar_files(path):
    for suffix in ("-journal", "-wal", "-shm"):
        sidecar = Path(f"{path}{suffix}")
        if sidecar.exists():
            try:
                sidecar.unlink()
            except PermissionError:
                # Another process may still hold the sidecar file.
                pass


def _initialize_path(path, pragmas):
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=10)
    try:
        _apply_pragmas(conn, pragmas)
        ensure_schema(conn)
        conn.commit()
    finally:
        conn.close()


def resolve_db_config():
    errors = []
    candidate_modes = (
        (PRIMARY_DB_PATH, (DEFAULT_PRAGMAS, SAFE_PRAGMAS)),
        (FALLBACK_DB_PATH, (SAFE_PRAGMAS,)),
    )

    for candidate, modes in candidate_modes:
        _cleanup_sidecar_files(candidate)

        if candidate.exists() and candidate.stat().st_size == 0:
            try:
                candidate.unlink()
            except PermissionError:
                pass

        for pragmas in modes:
            try:
                _initialize_path(candidate, pragmas)
                if candidate != PRIMARY_DB_PATH:
                    print(
                        f"[cgpa-tracker] Primary database unavailable; "
                        f"using fallback database at: {candidate}"
                    )
                if pragmas == SAFE_PRAGMAS:
                    print(
                        "[cgpa-tracker] Enabled SQLite safe mode "
                        "(journal_mode=MEMORY) due to disk I/O constraints."
                    )
                return candidate, pragmas
            except sqlite3.Error as exc:
                mode_name = "default" if pragmas == DEFAULT_PRAGMAS else "safe"
                errors.append(f"{candidate} ({mode_name}): {exc}")

    details = " | ".join(errors)
    raise RuntimeError(f"Unable to initialize SQLite database. {details}")


DB_PATH, ACTIVE_PRAGMAS = resolve_db_config()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    _apply_pragmas(conn, ACTIVE_PRAGMAS)
    return conn

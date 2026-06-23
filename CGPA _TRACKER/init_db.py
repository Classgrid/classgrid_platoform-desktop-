from db_utils import DB_PATH, get_db_connection


def init_db():
    conn = get_db_connection()
    conn.close()
    print(f"Database is ready at: {DB_PATH}")


if __name__ == "__main__":
    init_db()

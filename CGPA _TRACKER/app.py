from flask import Flask, abort, render_template, request, redirect
from db_utils import get_db_connection

app = Flask(__name__)

LEGAL_PAGES = [
    {
        "slug": "privacy-policy",
        "title": "Privacy Policy",
        "tagline": "How we collect, use, and protect student data.",
        "kicker": "Data Trust",
        "effective_date": "April 20, 2026",
        "sections": [
            {
                "heading": "Information We Collect",
                "description": "We only collect information needed to provide CGPA tracking features.",
                "bullets": [
                    "Profile data such as name, email, and account metadata.",
                    "Academic entries you add such as semesters, subjects, and grades.",
                    "Basic device and usage analytics used to improve reliability and performance.",
                ],
            },
            {
                "heading": "How We Use Information",
                "description": "Your information is used to deliver and improve the platform.",
                "bullets": [
                    "Compute SGPA, CGPA, and academic insights.",
                    "Maintain account security and prevent abuse.",
                    "Support product updates, debugging, and service communications.",
                ],
            },
            {
                "heading": "Data Sharing and Retention",
                "description": "We do not sell personal data and limit sharing to trusted processors.",
                "bullets": [
                    "Service providers may process data only for platform operations.",
                    "Data is retained while your account is active or as required by law.",
                    "You may request correction or deletion through support channels.",
                ],
            },
        ],
    },
    {
        "slug": "terms-and-conditions",
        "title": "Terms and Conditions",
        "tagline": "The rules and responsibilities for using this service.",
        "kicker": "Platform Rules",
        "effective_date": "April 20, 2026",
        "sections": [
            {
                "heading": "Acceptance and Eligibility",
                "description": "By using the platform, you agree to these terms.",
                "bullets": [
                    "You must provide accurate information when creating or using an account.",
                    "You are responsible for activity performed under your account.",
                    "You agree to use the service only for lawful and academic purposes.",
                ],
            },
            {
                "heading": "User Responsibilities",
                "description": "You retain ownership of your content while granting us rights to operate the service.",
                "bullets": [
                    "You own the academic data you submit.",
                    "You grant us permission to process that data to deliver features.",
                    "You must not upload harmful code or attempt unauthorized access.",
                ],
            },
            {
                "heading": "Service Availability and Liability",
                "description": "We work to keep the service available but cannot guarantee uninterrupted access.",
                "bullets": [
                    "Features may be updated, modified, or discontinued with reasonable notice.",
                    "Service is provided on an as-is basis where allowed by law.",
                    "Liability is limited to the maximum extent permitted by applicable law.",
                ],
            },
        ],
    },
    {
        "slug": "cookie-policy",
        "title": "Cookie Policy",
        "tagline": "How cookies and similar technologies are used.",
        "kicker": "Tracking Controls",
        "effective_date": "April 20, 2026",
        "sections": [
            {
                "heading": "What Cookies Are",
                "description": "Cookies are small files stored on your browser to remember settings and sessions.",
                "bullets": [
                    "Essential cookies support login, security, and core app behavior.",
                    "Preference cookies remember choices such as language or display options.",
                    "Analytics cookies help us understand performance and user journeys.",
                ],
            },
            {
                "heading": "How We Use Cookies",
                "description": "Cookies are used to keep the app secure and improve usability.",
                "bullets": [
                    "Maintain authenticated sessions and protect against fraud.",
                    "Measure feature usage to improve navigation and speed.",
                    "Debug service reliability issues with aggregated diagnostics.",
                ],
            },
            {
                "heading": "Your Choices",
                "description": "You can control cookie behavior from browser settings.",
                "bullets": [
                    "Block or remove non-essential cookies through browser controls.",
                    "Disabling essential cookies may affect login and core features.",
                    "You can request privacy support for detailed cookie questions.",
                ],
            },
        ],
    },
    {
        "slug": "disclaimer",
        "title": "Disclaimer",
        "tagline": "Important limitations about educational use and guidance.",
        "kicker": "Notice",
        "effective_date": "April 20, 2026",
        "sections": [
            {
                "heading": "Informational Use",
                "description": "This platform provides academic tracking support only.",
                "bullets": [
                    "Outputs are estimates based on the grades and credits you enter.",
                    "Official university results and policies always take precedence.",
                    "Users should validate results against institutional records.",
                ],
            },
            {
                "heading": "No Professional Advice",
                "description": "Information in the app is not legal, financial, or professional advice.",
                "bullets": [
                    "Do not rely solely on this app for high-stakes decisions.",
                    "Consult qualified advisors when needed.",
                    "You are responsible for your own academic decisions and submissions.",
                ],
            },
            {
                "heading": "External Links and Updates",
                "description": "Third-party links and references may change over time.",
                "bullets": [
                    "We are not responsible for external website content or availability.",
                    "Policies may be revised to reflect legal and product updates.",
                    "Continued use after updates implies acceptance of revised notices.",
                ],
            },
        ],
    },
]

LEGAL_PAGE_BY_SLUG = {page["slug"]: page for page in LEGAL_PAGES}


def get_db():
    return get_db_connection()


def render_legal_page(slug):
    page = LEGAL_PAGE_BY_SLUG.get(slug)
    if page is None:
        abort(404)
    return render_template("legal_page.html", page=page, legal_pages=LEGAL_PAGES)


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/legal")
def legal_center():
    return render_template("legal_center.html", legal_pages=LEGAL_PAGES)


@app.route("/legal/<slug>")
def legal_page(slug):
    return render_legal_page(slug)


@app.route("/privacy-policy")
def privacy_policy():
    return render_legal_page("privacy-policy")


@app.route("/terms-and-conditions")
def terms_and_conditions():
    return render_legal_page("terms-and-conditions")


@app.route("/cookie-policy")
def cookie_policy():
    return render_legal_page("cookie-policy")


@app.route("/disclaimer")
def disclaimer():
    return render_legal_page("disclaimer")


@app.route("/add_semester", methods=["GET", "POST"])
def add_semester():
    if request.method == "POST":
        sem_no = request.form["semester_number"]

        conn = get_db()
        c = conn.cursor()
        c.execute(
            "INSERT INTO semesters (semester_number, sgpa) VALUES (?, ?)",
            (sem_no, 0),
        )
        conn.commit()
        conn.close()

        return redirect("/semesters")

    return render_template("add_semester.html")


@app.route("/semesters")
def semesters():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM semesters ORDER BY semester_number")
    data = c.fetchall()
    conn.close()
    return render_template("semesters.html", semesters=data)


@app.route("/semester/<int:sem_id>")
def semester_detail(sem_id):
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT * FROM semesters WHERE id=?", (sem_id,))
    semester = c.fetchone()

    c.execute("SELECT * FROM subjects WHERE semester_id=?", (sem_id,))
    subjects = c.fetchall()

    total_credits = sum(sub["credits"] for sub in subjects)
    total_points = sum(sub["credits"] * sub["grade_points"] for sub in subjects)

    sgpa = 0
    if total_credits != 0:
        sgpa = round(total_points / total_credits, 2)

    conn.close()

    return render_template(
        "semester_detail.html",
        semester=semester,
        subjects=subjects,
        sem_id=sem_id,
        total_credits=total_credits,
        total_points=total_points,
        sgpa=sgpa,
    )


@app.route("/add_subject/<int:sem_id>", methods=["GET", "POST"])
def add_subject(sem_id):
    if request.method == "POST":
        name = request.form["name"].strip()
        if name == "":
            return "Invalid subject name"

        try:
            credits = int(request.form["credits"])
            if credits <= 0:
                return "Credits must be positive number"
        except ValueError:
            return "Credits must be a number!"

        grade = request.form["grade"].upper()
        valid_grades = ["O", "A", "B", "C", "D", "F"]
        if grade not in valid_grades:
            return "Invalid grade"

        grade_map = {"O": 10, "A": 9, "B": 8, "C": 7, "D": 6, "F": 0}
        grade_points = grade_map.get(grade, 0)

        conn = get_db()
        c = conn.cursor()

        c.execute(
            "SELECT * FROM subjects WHERE semester_id=? AND name=?",
            (sem_id, name),
        )
        existing = c.fetchone()
        if existing:
            conn.close()
            return "Subject already exists in this semester"

        c.execute(
            """
            INSERT INTO subjects (semester_id, name, credits, grade, grade_points)
            VALUES (?, ?, ?, ?, ?)
            """,
            (sem_id, name, credits, grade, grade_points),
        )
        conn.commit()

        c.execute("SELECT credits, grade_points FROM subjects WHERE semester_id=?", (sem_id,))
        subjects = c.fetchall()

        sgpa = calculate_sgpa_from_subjects(subjects)
        c.execute("UPDATE semesters SET sgpa=? WHERE id=?", (sgpa, sem_id))
        conn.commit()
        conn.close()

        return redirect(f"/semester/{sem_id}")

    return render_template("add_subject.html", sem_id=sem_id)


@app.route("/cgpa")
def cgpa():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT credits, grade_points FROM subjects")
    data = c.fetchall()

    total_points = 0
    total_credits = 0

    for row in data:
        total_points += row["credits"] * row["grade_points"]
        total_credits += row["credits"]

    cgpa_value = 0
    if total_credits != 0:
        cgpa_value = round(total_points / total_credits, 2)

    conn.close()
    return render_template("cgpa.html", cgpa=cgpa_value, total_credits=total_credits)


def calculate_sgpa_from_subjects(subjects):
    total_points = 0
    total_credits = 0

    for sub in subjects:
        credits = sub["credits"]
        gp = sub["grade_points"]

        total_points += credits * gp
        total_credits += credits

    if total_credits == 0:
        return 0

    return round(total_points / total_credits, 2)


@app.route("/analysis")
def analysis():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT name, credits, grade_points FROM subjects")
    subjects = c.fetchall()

    if not subjects:
        conn.close()
        return render_template("analysis.html", has_data=False)

    highest = max(subjects, key=lambda x: x["grade_points"])
    lowest = min(subjects, key=lambda x: x["grade_points"])

    total_credits = sum(sub["credits"] for sub in subjects)
    total_points = sum(sub["credits"] * sub["grade_points"] for sub in subjects)

    avg_gp = 0
    if total_credits != 0:
        avg_gp = round(total_points / total_credits, 2)

    conn.close()

    return render_template(
        "analysis.html",
        has_data=True,
        highest=highest,
        lowest=lowest,
        total_credits=total_credits,
        avg_gp=avg_gp,
    )


if __name__ == "__main__":
    app.run(debug=True)

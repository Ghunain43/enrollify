# app/parsing/curated.py
"""
Hand-verified MAJU facts. One small, self-contained entry per topic.
Each entry names the program/topic explicitly so it still makes sense
when retrieved on its own.

CURATED       -> loaded into the database by ingest_curated.py
TO_VERIFY     -> NOT loaded. Things to check on jinnah.edu, then add to CURATED.
"""

SITE = "https://jinnah.edu"

CURATED = [
    # ---------------- FEES ----------------
    {
        "title": "One-time admission charges (Application Processing Fee and Admission Fee)",
        "url": SITE,
        "text": "MAJU one-time charges for Fall 2026-27: the Application Processing Fee (APF) is "
                "PKR 3,000, non-refundable and non-transferable. The Admission Fee is PKR 20,000, "
                "non-refundable and non-transferable.",
    },
    {
        "title": "Tuition fee per credit hour",
        "url": SITE,
        "text": "Tuition fee at MAJU is PKR 10,000 per credit hour for most undergraduate and "
                "graduate programs: BBA, BS Accounting and Finance, BS FinTech, BS Business "
                "Computing, BS Psychology, BS Computer Science, BS Software Engineering, "
                "BS Artificial Intelligence, BS Cyber Security, BS Biotechnology, MBA, "
                "MS Management Sciences, MS Project Management, MS Computer Science, "
                "MS Software Engineering, MS Data Science, MS Biotechnology and MS Bioinformatics. "
                "PhD programs (Management Science, Computer Science, Biosciences) are "
                "PKR 13,000 per credit hour.",
    },
    {
        "title": "Withholding tax on fees",
        "url": SITE,
        "text": "A 5% withholding tax under the Income Tax Ordinance applies when the announced "
                "fee for a program exceeds Rs 200,000.",
    },
    {
        "title": "Fee refund policy",
        "url": SITE,
        "text": "MAJU Admission Fee is always non-refundable. Tuition fee refund for a "
                "1st-semester student who withdraws after registering: 100% refund up to the 7th "
                "day after the semester starts, 50% refund from the 8th to the 15th day, and no "
                "refund from the 16th day onward.",
    },

    # ---------------- CONTACT ----------------
    {
        "title": "MAJU contact information",
        "url": SITE,
        "text": "Contact Mohammad Ali Jinnah University (MAJU): UAN 021-111-87-87-87. "
                "Phone and WhatsApp: 0341-0003339. Email: info@jinnah.edu. Fax: 021-3431-1327. "
                "Other numbers: 34311325-6 and 34543321-25. Address: MAJU Bus Stop, Main "
                "Shahrah-e-Faisal, 22-E, Block-6, PECHS, Karachi-75400.",
    },

    # ---------------- DATES / CALENDAR ----------------
    {
        "title": "Admission dates and where to find them",
        "url": SITE,
        "text": "MAJU publishes admission dates per intake (Spring and Fall) on the Key Admission "
                "Dates page of jinnah.edu. The schedule covers: announcement of admissions, last "
                "date to apply (with Application Processing Fee), the MAJU Admission Test (MAT), "
                "interviews, provisional admission offer letter and fee voucher release, last "
                "date for fee submission, start of classes for foundation courses, and an "
                "orientation session. Exact dates change every intake, so students should check "
                "the current dates on jinnah.edu.",
    },
    {
        "title": "Academic calendar structure of a semester",
        "url": SITE,
        "text": "A typical MAJU semester includes: online registration and fee submission for "
                "existing batches, orientation for new intake, start of classes, online course "
                "add/drop, midterm exams, resumption of classes after midterms, midterm result "
                "declaration, online course withdrawal window, students feedback activity, end of "
                "classes, final exams, and final result declaration. Summer semesters run a "
                "compressed version of the same structure. Exact dates change every semester, so "
                "students should check the Academic Calendar page on jinnah.edu.",
    },

    # ---------------- ADMISSION TEST ----------------
    {
        "title": "Admission test format: general undergraduate programs",
        "url": SITE,
        "text": "MAJU admission test for most undergraduate programs (general): English 10 "
                "questions (17%), Math 25 questions (42%), Physics 20 questions (33%), Reading "
                "Comprehension 5 questions (8%).",
    },
    {
        "title": "Admission test format: BS Computer Science, BS Software Engineering, BBA, BS Accounting and Finance, BS Psychology",
        "url": SITE,
        "text": "MAJU admission test for BS Computer Science, BS Software Engineering, BBA, "
                "BS Accounting and Finance and BS Psychology: Quantitative 30 questions (50%), "
                "English 15 questions (25%), General Knowledge 10 questions (17%), Reading "
                "Comprehension 5 questions (8%).",
    },
    {
        "title": "Admission test format: BS Biosciences, Microbiology, Biotechnology",
        "url": SITE,
        "text": "MAJU admission test for BS Biosciences, BS Microbiology and BS Biotechnology: "
                "Biology 30 questions (50%), English 15 questions (25%), General Knowledge 10 "
                "questions (17%), Reading Comprehension 5 questions (8%).",
    },
    {
        "title": "Admission test format: MS, MBA and PhD programs",
        "url": SITE,
        "text": "MAJU admission test for all MS, MBA and PhD programs: English 15 questions (25%), "
                "Analytical and Quantitative 15 questions (25%), Specialization 30 questions (50%).",
    },
    {
        "title": "Admission test alternate published format (essay plus MCQs)",
        "url": SITE,
        "text": "An alternate published format describes the MAJU undergraduate test as: Part I "
                "Essay Writing (20 minutes, 20 marks); Part II MCQs (100 minutes, 100 marks) split "
                "into Verbal Reasoning (50 MCQs: analogy, synonym, antonym, sentence completion, "
                "comprehension) and Quantitative Reasoning (50 MCQs: arithmetic, algebra and "
                "functions, geometry, equations, statistics). The graduate test is similar with an "
                "added Analytical Reasoning section.",
    },

    # ---------------- MERIT LIST ----------------
    {
        "title": "Merit list weightage: BS, BBA, MS and MBA programs",
        "url": SITE,
        "text": "MAJU merit list for all BS programs, BBA, and graduate/MBA programs: Previous "
                "Academic Record 30%, Admission Test 50%, Interview 20%.",
    },
    {
        "title": "Merit list weightage: PhD programs and result-awaiting candidates",
        "url": SITE,
        "text": "MAJU merit list for PhD programs: 16-year degree 15%, 18-year degree 15%, "
                "Interview 30%, Admission Test 40%. Result-awaiting candidates are scored using "
                "marks from their last available result (for example Part-I marks for FSc). A "
                "candidate who failed a subject and is still result-awaiting after the "
                "supplementary exam receives zero marks in the merit list.",
    },

    # ---------------- ELIGIBILITY ----------------
    
    # ---------------- SCHOLARSHIPS ----------------
    {
        "title": "Scholarship rules: one at a time, minimum CGPA and credit load",
        "url": SITE + "/scholarship",
        "text": "MAJU scholarships: only one scholarship can be availed at a time, even if a "
                "student is eligible for several, and a formal application on the prescribed form "
                "is required. Minimum CGPA to continue a scholarship (excluding Merit "
                "Scholarships): Undergraduate (BS/BBA) 2.50, Graduate (MS/MBA) 3.00, PhD 3.50. "
                "Minimum credit-hour load per semester to continue: Undergraduate 15, Graduate 9, "
                "PhD 6.",
    },
    {
        "title": "When MAJU scholarships are NOT granted",
        "url": SITE + "/scholarship",
        "text": "MAJU scholarships are not granted: during the Summer semester; if the program "
                "duration is exceeded; if the student takes a semester break; if registered credit "
                "hours after Add/Drop fall below the full load; or if the transcript shows any F, "
                "W, I or repeated course. A disciplinary warning also removes scholarship "
                "eligibility.",
    },
    {
        "title": "Academic Performance Scholarship by semester GPA",
        "url": SITE + "/scholarship",
        "text": "MAJU Academic Performance Scholarship, based on semester GPA: 3.75 to 3.89 GPA "
                "gives a 25% scholarship, 3.90 to 3.99 gives 50%, and 4.00 gives 100%. The student "
                "must have taken a full academic load (except in the final semester) and must not "
                "have exceeded program duration or taken a semester break.",
    },

    # ---------------- GRADING / POLICIES ----------------
    {
        "title": "Assessment weightage per course",
        "url": SITE,
        "text": "MAJU assessment weightage per course: Midterm Examination 20-25%, Assignments, "
                "Quizzes and Projects 10-35%, Final Examination 40-50%.",
    },
    {
        "title": "Academic probation and course repeat rules",
        "url": SITE,
        "text": "MAJU academic probation: a student is placed on probation for failing to reach "
                "2.0 CGPA (undergraduate), 2.5 CGPA (graduate) or 3.0 CGPA (doctoral) in a "
                "semester. An undergraduate on probation must repeat any course graded F, C-, D+ "
                "or D. A graduate student on probation repeats F, C- or C. A doctoral student "
                "repeats F or B-.",
    },
    {
        "title": "Incomplete (I) grade and withdrawal after a missed final exam",
        "url": SITE,
        "text": "At MAJU, an 'I' (Incomplete) grade must be resolved into an earned grade within 1 "
                "month or it automatically becomes an F. A student who misses a final exam due to "
                "hospitalization or another extenuating circumstance (for example the death of an "
                "immediate family member) on the exam day may apply for course withdrawal.",
    },
    {
        "title": "Credit transfer policy",
        "url": SITE,
        "text": "MAJU credit transfer: transferable credit cannot exceed 50% of the total credit "
                "hours required for the degree. The department has the sole right to accept or "
                "reject a transfer request. A student with transferred credit hours is not "
                "eligible for a university medal or merit scholarship.",
    },
    {
        "title": "Changing program and other admission FAQs",
        "url": SITE,
        "text": "MAJU FAQs: a student can change their discipline/program once after taking "
                "admission, provided they meet the new program's eligibility criteria. If a "
                "result-awaiting candidate fails to reach the required marks, percentage or CGPA, "
                "their admission is cancelled and the fee is refunded per the University Fee "
                "Refund Policy in the prospectus. Students previously expelled from another "
                "institution for discipline, poor performance or time-barred reasons will not be "
                "entertained for admission.",
    },

    # ---------------- DISCIPLINE / DRESS CODE ----------------
    {
        "title": "Student discipline: acts of indiscipline at MAJU",
        "url": SITE + "/my-maju/allpolicy/students-discipline",
        "text": "The MAJU Discipline Committee can penalize acts of indiscipline, including: "
                "violating the dress code or ID card rules; indecent language or gestures; "
                "disorderly behavior (abuse, quarreling, fighting); insolence toward others; "
                "physical or verbal harm to colleagues, teachers or staff; defying a University "
                "official; spreading religious, sectarian, ethnic or linguistic hatred; "
                "impersonation, false information or cheating; possessing weapons; damaging or "
                "misusing University property; consuming or distributing intoxicants on campus; "
                "using student organizations for political party activity; bringing expelled "
                "students or anti-social elements on campus; obstructing University functioning; "
                "and misconduct during examinations (talking, noise, throwing objects).",
    },
    {
        "title": "Student discipline: minor and major penalties",
        "url": SITE + "/my-maju/allpolicy/students-discipline",
        "text": "MAJU minor penalties: verbal or written warning, probation for a period, a fine, "
                "withheld certificate of good moral character, withdrawal of student privileges, "
                "withheld exam results. Major penalties: fines commensurate with the offense, up "
                "to rustication or expulsion, decided by the Disciplinary Committee following "
                "procedure.",
    },
    {
        "title": "MAJU dress code for boys",
        "url": SITE + "/my-maju/allpolicy/students-discipline",
        "text": "MAJU dress code for boys. Desirable: trousers, shirt, tie, dress shoes with "
                "socks, or a clean pressed Shalwar Kameez with waistcoat. Admissible: clean "
                "pressed jeans with a T-shirt, Shalwar Kameez, or summer sandals with a heel "
                "strap. Not allowed: shorts, cut-off, faded, torn or skin-fitted jeans, T-shirts "
                "with messages or slogans, slippers or chappals, bandanas or caps, vests, long "
                "hair or ponytails, and visible jewelry such as earrings, chains or bracelets.",
    },
    {
        "title": "MAJU dress code for girls",
        "url": SITE + "/my-maju/allpolicy/students-discipline",
        "text": "MAJU dress code for girls. Desirable: traditional Shalwar Kameez and dupatta, "
                "chappals or shoes. Admissible: jeans with a kurta or shirt, light jewelry (nose "
                "pin, ear studs, rings). Not allowed: T-shirts with jeans, sleeveless shirts, "
                "see-through or skin-tight dresses, heavy makeup, flashy or heavy jewelry.",
    },
    {
        "title": "MAJU University ID card rules",
        "url": SITE + "/my-maju/allpolicy/students-discipline",
        "text": "Every MAJU student must carry and display a valid University ID card on campus at "
                "all times. Entry to the Examination Hall, Library, Labs and other premises "
                "requires a valid ID card and an intact semester registration.",
    },

    # ---------------- BS COMPUTER SCIENCE ----------------
    {
        "title": "BS Computer Science curriculum: core courses",
        "url": SITE + "/faculty-of-computing/department-of-computer-science/bs-computer-science",
        "text": "BS Computer Science at MAJU has 60 credit hours of core courses: Introduction to "
                "Computing + Lab, Computer Programming + Lab, Object Oriented Programming + Lab, "
                "Data Structure and Algorithm + Lab, Software Engineering + Lab, Database "
                "Management Systems + Lab, Discrete Structures, Operating Systems + Lab, Data "
                "Communications and Networking + Lab, Information and Network Security, Digital "
                "Logic Design + Lab, Theory of Automata, Computer Organization and Assembly "
                "Language + Lab, Parallel and Distributed Computing, Design and Analysis of "
                "Algorithms, Human Computer Interaction, Artificial Intelligence + Lab, "
                "Professional Issues in Computing, Compiler Construction.",
    },
    {
        "title": "BS Computer Science curriculum: elective courses",
        "url": SITE + "/faculty-of-computing/department-of-computer-science/bs-computer-science",
        "text": "BS Computer Science elective courses at MAJU: Game Programming, Data Science with "
                "Python, Introduction to Data Science, Web Engineering, Enterprise Resource "
                "Planning, Text Classification.",
    },

    # ---------------- BS SOFTWARE ENGINEERING ----------------
    {
        "title": "BS Software Engineering curriculum: core courses",
        "url": SITE + "/faculty-of-computing/department-of-computer-science/bs-software-engineering",
        "text": "BS Software Engineering at MAJU has 65 credit hours of core courses: Introduction "
                "to Computing + Lab, Computer Programming + Lab, Object Oriented Programming + "
                "Lab, Data Structure and Algorithm + Lab, Software Engineering + Lab, Database "
                "Management Systems + Lab, Discrete Structures, Operating Systems + Lab, Data "
                "Communications and Networking + Lab, Information and Network Security, Human "
                "Computer Interaction, Professional Issues in Computing, Software Requirement "
                "Engineering, Software Construction and Development, Software Project Management, "
                "Software Architecture + Lab, Web Engineering, Software Quality Engineering, "
                "Software Re-engineering.",
    },
    {
        "title": "BS Software Engineering curriculum: elective courses",
        "url": SITE + "/faculty-of-computing/department-of-computer-science/bs-software-engineering",
        "text": "BS Software Engineering elective courses at MAJU: Game Programming, Introduction "
                "to Data Science, Mobile Application Development, Developer Operations, Big Data, "
                "Deep Learning, Computer Vision, Information Retrieval Techniques, Cloud Computing.",
    },

    # ---------------- BS BUSINESS COMPUTING ----------------
    {
        "title": "BS Business Computing plan of study: Semester 1",
        "url": SITE + "/faculty-of-business-administration/school-of-business-administration-soba/bs-business-computing",
        "text": "BS Business Computing at MAJU, Semester 1: Basic Mathematics, Functional English, "
                "Islamic Studies/Ethics, Principles of Management, Application of Information and "
                "Communication Technology.",
    },
    {
        "title": "BS Business Computing plan of study: Semester 3",
        "url": SITE + "/faculty-of-business-administration/school-of-business-administration-soba/bs-business-computing",
        "text": "BS Business Computing at MAJU, Semester 3: Software Engineering, Professional "
                "Practices, Positive Psychology, Oral Communication, Human Resource Management.",
    },
    {
        "title": "BS Business Computing plan of study: Semester 4",
        "url": SITE + "/faculty-of-business-administration/school-of-business-administration-soba/bs-business-computing",
        "text": "BS Business Computing at MAJU, Semester 4: Ideology and Constitution of Pakistan, "
                "Entrepreneurship, Human Computer Interaction, Database Management System, AI "
                "Programming with Python.",
    },
    {
        "title": "BS Business Computing plan of study: Semester 5",
        "url": SITE + "/faculty-of-business-administration/school-of-business-administration-soba/bs-business-computing",
        "text": "BS Business Computing at MAJU, Semester 5: Islamic Banking and Finance, Business "
                "Analytics, Business Research Methods, Data Structures and Algorithms.",
    },
    {
        "title": "BS Business Computing plan of study: Semester 6",
        "url": SITE + "/faculty-of-business-administration/school-of-business-administration-soba/bs-business-computing",
        "text": "BS Business Computing at MAJU, Semester 6: Quantitative Research Tools, Big Data "
                "and Cloud Computing, Cyber Security, Organizational Behavior.",
    },
        {
        "title": "Who is the President of MAJU",
        "url": "https://jinnah.edu/faculty-of-computing/faculty-members",
        "text": "The President of Mohammad Ali Jinnah University (MAJU) is Dr. Zubair Ahmed Shaikh, "
                "listed as President and Professor on the university's Faculty of Computing members page.",
    },
    {
        "title": "Dean of the Faculty of Computing",
        "url": "https://jinnah.edu/faculty-of-computing/faculty-members",
        "text": "The Dean of the Faculty of Computing at MAJU is Dr. Shaukat Wasi (Professor). "
                "Dr. Syed Imran Jami (Professor) is the Academic Dean of the Faculty of Computing.",
    },
    {
        "title": "Registrar and Director IT at MAJU",
        "url": "https://jinnah.edu/faculty-of-computing/faculty-members",
        "text": "Muhammad Kashif Khan (Assistant Professor) is listed as Registrar at MAJU. "
                "Nauman Hafeez Ansari (Assistant Professor) is listed as Director IT.",
    },
]


# NOT loaded into the database. Check each on jinnah.edu, then add to CURATED.
TO_VERIFY = [
    "Current cycle's actual admission dates (Key Admission Dates page).",
    "Current academic calendar dates (Academic Calendar page).",
    "BS Business Computing: Semesters 2, 7 and 8 are missing from the old data.",
    "Course codes and credit hours were left out on purpose. Old data looked wrong: "
    "Computer Programming Lab listed 3 Cr and theory 1 Cr (likely swapped); Digital Logic "
    "Design and its Lab both used code CS1230. Re-copy them from the program pages.",
    "Tuition list does not mention BS Business Analytics, but eligibility does. Confirm its fee.",
    "Old eligibility page said 'Spring 2026 intake' while fees say 'Fall 2026-27'. Confirm "
    "eligibility is current for the intake you want the bot to answer for.",
    "Two different admission test formats were in the old data (section-based vs essay + MCQs). "
    "Confirm which is current and delete the other.",
    "Other programs not covered at all yet: BBA, BS AI, BS Cyber Security, BS Accounting and "
    "Finance, BS FinTech, BS Psychology, BS Biotechnology, MS and PhD curricula.",
    "Not covered at all: hostel, transport, library, sports, societies, exam rules, "
    "attendance policy, grading scale (grade points), degree completion requirements.",
]
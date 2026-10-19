import subprocess, sys, os

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

C = {"core": "#1F2A44", "people": "#2E6F95", "mentor": "#A84F14", "events": "#3B7D4F"}

T = {
 "users": ("core", [("id","uuid","PK"),("email","varchar","UK"),("password_hash","text",""),("full_name","varchar",""),("role","enum",""),("status","enum",""),("created_at","timestamptz","")]),
 "institutions": ("people", [("id","int","PK"),("name","varchar","UK"),("city","varchar",""),("district","varchar","")]),
 "student_profiles": ("people", [("user_id","uuid","PK, FK"),("institution_id","int","FK"),("branch","varchar",""),("enrollment_year","smallint",""),("expected_grad_year","smallint",""),("career_goal","varchar",""),("bio","text","")]),
 "alumni_profiles": ("people", [("user_id","uuid","PK, FK"),("institution_id","int","FK"),("branch","varchar",""),("graduation_year","smallint",""),("current_company","varchar",""),("job_title","varchar",""),("industry","varchar",""),("location","varchar",""),("linkedin_url","text",""),("is_verified","bool",""),("available_for_mentoring","bool","")]),
 "skills": ("people", [("id","int","PK"),("name","varchar","UK")]),
 "user_skills": ("people", [("user_id","uuid","PK, FK"),("skill_id","int","PK, FK")]),
 "verification_requests": ("people", [("id","int","PK"),("user_id","uuid","FK"),("document_url","text",""),("status","enum",""),("reviewed_by","uuid","FK"),("remarks","text",""),("submitted_at","timestamptz",""),("reviewed_at","timestamptz","")]),
 "mentorship_requests": ("mentor", [("id","int","PK"),("student_id","uuid","FK"),("alumni_id","uuid","FK"),("message","text",""),("match_score","numeric",""),("status","enum",""),("created_at","timestamptz",""),("responded_at","timestamptz","")]),
 "forum_posts": ("mentor", [("id","int","PK"),("author_id","uuid","FK"),("title","varchar",""),("body","text",""),("category","varchar",""),("is_flagged","bool",""),("created_at","timestamptz","")]),
 "forum_comments": ("mentor", [("id","int","PK"),("post_id","int","FK"),("author_id","uuid","FK"),("body","text",""),("is_flagged","bool",""),("created_at","timestamptz","")]),
 "content_reports": ("mentor", [("id","int","PK"),("reporter_id","uuid","FK"),("post_id","int","FK"),("comment_id","int","FK"),("reason","varchar",""),("status","enum",""),("created_at","timestamptz","")]),
 "events": ("events", [("id","int","PK"),("organizer_id","uuid","FK"),("title","varchar",""),("description","text",""),("type","enum",""),("mode","enum",""),("venue_or_link","text",""),("start_time","timestamptz",""),("capacity","int","")]),
 "event_registrations": ("events", [("event_id","int","PK, FK"),("user_id","uuid","PK, FK"),("registered_at","timestamptz",""),("attended","bool","")]),
 "jobs": ("events", [("id","int","PK"),("posted_by","uuid","FK"),("title","varchar",""),("company","varchar",""),("type","enum",""),("location","varchar",""),("description","text",""),("deadline","date","")]),
 "job_applications": ("events", [("id","int","PK"),("job_id","int","FK"),("student_id","uuid","FK"),("resume_url","text",""),("status","enum",""),("applied_at","timestamptz","")]),
}

# (parent, parent_col, child, child_col, label, child_card)  child_card: "many" or "one"
R = [
 ("institutions","id","student_profiles","institution_id","enrolls","many"),
 ("institutions","id","alumni_profiles","institution_id","graduated","many"),
 ("users","id","student_profiles","user_id","has","one"),
 ("users","id","alumni_profiles","user_id","has","one"),
 ("users","id","user_skills","user_id","has","many"),
 ("skills","id","user_skills","skill_id","tagged","many"),
 ("users","id","verification_requests","user_id","submits","many"),
 ("users","id","verification_requests","reviewed_by","reviews","many"),
 ("users","id","mentorship_requests","student_id","sends","many"),
 ("users","id","mentorship_requests","alumni_id","receives","many"),
 ("users","id","forum_posts","author_id","writes","many"),
 ("forum_posts","id","forum_comments","post_id","has","many"),
 ("users","id","forum_comments","author_id","writes","many"),
 ("users","id","content_reports","reporter_id","files","many"),
 ("forum_posts","id","content_reports","post_id","reported","many"),
 ("forum_comments","id","content_reports","comment_id","reported","many"),
 ("users","id","events","organizer_id","organizes","many"),
 ("events","id","event_registrations","event_id","has","many"),
 ("users","id","event_registrations","user_id","registers","many"),
 ("users","id","jobs","posted_by","posts","many"),
 ("jobs","id","job_applications","job_id","receives","many"),
 ("users","id","job_applications","student_id","applies","many"),
]

FONT = "Inter"

def table_label(name, cols, mod, slim=False):
    color = C[mod]
    rows = [f'<TR><TD COLSPAN="3" BGCOLOR="{color}" ALIGN="CENTER" CELLPADDING="10"><FONT COLOR="#FFFFFF" POINT-SIZE="17"><B>{name}</B></FONT></TD></TR>']
    if not slim:
        for i,(c,t,k) in enumerate(cols):
            bg = "#FFFFFF" if i % 2 == 0 else "#F4F1EA"
            kc = "#A84F14" if "PK" in k else "#2E6F95"
            kk = f'<FONT COLOR="{kc}"><B>{k}</B></FONT>' if k else " "
            cb = f"<B>{c}</B>" if "PK" in k else c
            rows.append(f'<TR><TD PORT="{c}_w" ALIGN="LEFT" BGCOLOR="{bg}">{cb}</TD><TD ALIGN="LEFT" BGCOLOR="{bg}"><FONT COLOR="#6B7280">{t}</FONT></TD><TD PORT="{c}_e" ALIGN="LEFT" BGCOLOR="{bg}">{kk}</TD></TR>')
    return f'<<TABLE BORDER="1" COLOR="#9AA3B2" CELLBORDER="0" CELLSPACING="0" CELLPADDING="6">{"".join(rows)}</TABLE>>'

def build(name, tables, rels, slim=False, rankdir="LR", extra=""):
    lines = [f'digraph G {{', f'graph [rankdir={rankdir}, splines=spline, nodesep=0.6, ranksep=1.3, pad=0.4, bgcolor="#FFFFFF", fontname="{FONT}"{extra}];',
             f'node [shape=plain, fontname="{FONT}", fontsize=14];',
             f'edge [fontname="{FONT}", fontsize=13, color="#4A5568", fontcolor="#1F2A44", penwidth=1.6, dir=both, arrowsize=1.1];']
    for t in tables:
        mod, cols = T[t]
        lines.append(f'"{t}" [label={table_label(t, cols, mod, slim)}];')
    for p,pc,c,cc,lab,card in rels:
        if p in tables and c in tables:
            head = "noneteeodot" if card == "one" else "crowodot"
            if slim:
                lines.append(f'"{p}" -> "{c}" [arrowtail=teetee, arrowhead={head}, label=" {lab} "];')
            else:
                lines.append(f'"{p}":"{pc}_e":e -> "{c}":"{cc}_w":w [arrowtail=teetee, arrowhead={head}, label=" {lab} "];')
    lines.append("}")
    dot = "\n".join(lines)
    path = os.path.join(OUT, name)
    open(path + ".dot", "w").write(dot)
    subprocess.run(["dot", "-Tpng", "-Gdpi=170", "-o", path + ".png", path + ".dot"], check=True)
    subprocess.run(["dot", "-Tsvg", "-o", path + ".svg", path + ".dot"], check=True)

build("er-diagram", list(T), R)
build("er-overview", list(T), R, slim=True, rankdir="TB", extra=", ranksep=1.6, nodesep=0.35")
build("er-users-profiles", ["users","institutions","student_profiles","alumni_profiles","skills","user_skills","verification_requests"], R)
build("er-mentorship-forum", ["users","mentorship_requests","forum_posts","forum_comments","content_reports"], R)
build("er-events-jobs", ["users","events","event_registrations","jobs","job_applications"], R)
print("done")

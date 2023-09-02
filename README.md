# s23_team_9 GroupGrader
This is the repository for s23_team_9 final project **GroupGrader**

# Project Bio
## Introduction
GroupGrader is an online assignment submission and grading web application motivated by Gradescope.
## Authors
Ran Fang (ranf), Ging Luo (yichuanl)
## URL
https://www.yichuanl.com
## Current version
Final Demo

# Installations and instructions
## Installation
No extra installation needed. Please launch at https://www.yichuanl.com
## For users
* You have to use an andrew email (*@andrew.cmu.edu*) or a gmail  (*@gmail*) to be authorized to log in.
* After logged in, you could find the course enrollment is invitation based. Students need a course number from instructor to enroll.

# Features
## Separate login options
* Groupgrader utilizes [OAuth](https://oauth.net/2/) as a registeration and logging in media.
* Users will be prompted to choose different identities before being directed to the dashboard page. After that, graders and students will see different pages.
## Course Creation & Enrollment
* Instructors can create new courses that allows students and other instructors to enroll (invitation based).
* Enrolled courses will show up on the dashboard page with course information and colored card with *AJAX*.
## Assignment Creation, Fetch & Submission
* Instructors can **create** new assignments with **handout**, **rubric** and score details.
* Students can **download** published assignment's handout,  submit assignments w/ *page selection*, preview their submissions, set an active version, and **resubmit**. 
## Group Grading & Assignment Status
* Grades can view an assignment's submission count, grading progress, and **statistics**.
* Students can view an assignment's submission status, release status and score.
* Grades can **select a group** of students to grade only their submissions.
## Grading & Reviewing with Rubrics & Score Breakdown
* Detailed **rubric & score-breakdown** information shows up when graders grade and comment, and when students review.

***<span style="color:skyblue">Hope you enjoy using GroupGrader! :)</span>***

# Reference
* Bootstrap online doc:
    * https://getbootstrap.com/docs/5.2/getting-started/introduction/
* PDF.js:
    * https://mozilla.github.io/pdf.js
    * https://pspdfkit.com/blog/2021/how-to-build-a-javascript-pdf-viewer-with-pdfjs/
* django online doc:
    * https://docs.djangoproject.com/en/4.2/ref/models/
* oauth online doc:
    * https://www.tutorialspoint.com/oauth2.0/index.htm
* JSON and jQuery online tutorial:
    * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
    * https://jquery.com/
    * https://api.jquery.com/serializearray/
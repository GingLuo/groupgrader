from django.urls import path
from groupgrader import views

urlpatterns = [
    # general purpose
    path('', views.home_action, name='home'),
    path('test/', views.test_action, name='test'),
    # Only for testing. Not deployed online !
    # path('swicth-identity', views.swicth_identity_action, name='switch-identity'),
    
    path('download-pdf/<int:assn_id>', views.download_pdf, name='download-pdf'),
    path('get-pdf/<int:assn_id>', views.get_pdf, name='get-pdf'),
    path('get-photo/<int:id>', views.get_photo, name='photo'),
    path('get-rubric/<int:assn_id>', views.get_rubric, name='get-rubric'),
    path('get-rubric-pages/<int:assn_id>', views.get_rubric_pages, name='get-rubric-pages'),

    # Grader 
    # render page
    path('grader-dashboard', views.grader_dashboard_action, name='grader-dashboard'), 
    path('grader-course/<int:id>', views.grader_course_action, name='grader-course'),
    path('create-course', views.create_course_action, name='create-course'),
    path('grader-assignment/<int:assn>', views.grader_assignment_action, name='grader-assignment'),
    path('create-assignment/<int:id>', views.create_assignment_action, name='create-assignment'),
    path('grader-grade/<int:assn_id>/<int:from_group_grading>', views.grader_grade_action, name='grader-grade'),
    path('grader-statistics/<int:course_num>/<str:assn_name>', views.statistics_grader_action, name='grader-statistics'),
    path('grader-leave-course/<int:num>', views.grader_leave_course_action, name='grader-leave-course'),
    # Ajax GET
    path('list-course-grader', views.list_course_grader_action, name='list-course-grader'),
    path('list-grouped-submission-grader/<int:course_num>/<str:assn_name>', views.list_grouped_submission_grader_action, name='list-grouped-submission'),
    path('list-submission-grader/<int:course_num>/<str:assn_name>', views.list_submission_grader_action, name='list-submission-grader'),
    path('list-assignment-grader/<int:id>', views.list_assignment_grader_action, name='list-assignment-grader'),
    # POST
    path('grader-grade-submit/<int:assn_id>', views.grader_grade_submit_action, name='grader-grade-submit'),
    path('grader-release-score/<int:course_num>/<str:assn_name>', views.grader_release_score_action, name='grader-release-score'),
    path('enroll-course-grader', views.grader_enroll_course_action, name='enroll-course-grader'),
    
    path('group-grading/<int:course_num>/<int:assn_id>', views.group_grading_action, name='group-grading'),

    # Student
    # render page
    path('student-dashboard', views.student_dashboard_action, name='student-dashboard'),
    path('student-course/<int:id>', views.student_course_action, name='student-course'),
    path('student-assignment/<int:assn>', views.student_assignment_action, name='student-assignment'),
    path('student-leave-course/<int:num>', views.student_leave_course_action, name='student-leave-course'),
    # Ajax GET
    path('list-course-student', views.list_course_student_action, name='list-course-student'),
    path('list-assignment-student/<int:id>', views.list_assignment_student_action, name='list-assignment-student'),
    # POST
    path('re-submit-assignment/<int:prev_id>', views.resubmit_assignment_action, name='re-submit-assignment'),
    path('select-page/<int:assn_id>', views.select_page_action, name='select-page'),
    path('submit-assignment/<int:rubric_id>', views.submit_assignment_action, name='submit-assignment'),
    path('enroll-course-student', views.student_enroll_course_action, name='enroll-course-student'),
]
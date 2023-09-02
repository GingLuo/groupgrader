###############################################################
# 17437 Final Project - Group Grader
# Author: Ging Luo (yichuanl@andrew.cmu.edu), Ran Fang (ranf@andrew.cmu.edu)
# Date: 04/23/2023
###############################################################

from ast import Assign
import http
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, Http404
# NOTE: We return Http404 on Ajax failure to ensure javascript code can handle the error.
from django.http import FileResponse
from datetime import datetime
# from zoneinfo import ZoneInfo

from django.utils import timezone

from groupgrader.models import Student, Grader, Course, Assignment
from webapps.settings import BASE_DIR, GROUPGRADER_USERS, GROUPGRADER_TITLE

import json, copy

###############################################################################
# Wrappers
###############################################################################

def _student_check(action_function):
    def my_wrapper_function(request, *args, **kwargs):
        if 'title' not in request.session:
            request.session['title'] = GROUPGRADER_TITLE

        andrew = GROUPGRADER_USERS.split(":")[0]
        gmail = GROUPGRADER_USERS.split(":")[1]
        if not (request.user.email.endswith(andrew) or request.user.email.endswith(gmail)):
            message = f"You must use an e-mail address ending with {GROUPGRADER_USERS} " + gmail
            return render(request, 'groupgrader/home.html', {'message': message, 'logged_in': ""})

        # Check identity as Student or Grader here
        if not Student.objects.filter(user=request.user):
            redirect("home")
        
        return action_function(request, *args, **kwargs)
    return my_wrapper_function

def _grader_check(action_function):
    def my_wrapper_function(request, *args, **kwargs):
        if 'title' not in request.session:
            request.session['title'] = GROUPGRADER_TITLE

        andrew = GROUPGRADER_USERS.split(":")[0]
        gmail = GROUPGRADER_USERS.split(":")[1]
        if not (request.user.email.endswith(andrew) or request.user.email.endswith(gmail)):
            message = f"You must use an e-mail address ending with {GROUPGRADER_USERS} " + gmail
            return render(request, 'groupgrader/home.html', {'message': message, 'logged_in': ""})

        # Check identity as Student or Grader here
        if not Grader.objects.filter(user=request.user):
            redirect("home")
        
        return action_function(request, *args, **kwargs)
    return my_wrapper_function

# Either student or grader is fine
def _general_check(action_function):
    def my_wrapper_function(request, *args, **kwargs):
        if 'title' not in request.session:
            request.session['title'] = GROUPGRADER_TITLE

        andrew = GROUPGRADER_USERS.split(":")[0]
        gmail = GROUPGRADER_USERS.split(":")[1]
        if not (request.user.email.endswith(andrew) or request.user.email.endswith(gmail)):
            message = f"You must use an e-mail address ending with {GROUPGRADER_USERS} " + gmail
            return render(request, 'groupgrader/home.html', {'message': message, 'logged_in': ""})

        # Check identity as Student or Grader here
        if not (Grader.objects.filter(user=request.user) or Student.objects.filter(user=request.user)):
            redirect("home")
        
        return action_function(request, *args, **kwargs)
    return my_wrapper_function

###############################################################################
# General purpose functions
###############################################################################

@login_required
@_general_check
def logout_action(request):
    return render(request, "groupgrader/home.html")


# Record identity
def home_action(request):

    context = {}
    context['logged_in'] = ""
    message = ""

    if request.method == 'GET':
        if (request.user.id == None):
            message = "Welcome! Please log in!"
            context["message"] = message
            return render(request, "groupgrader/home.html", context)
        
        if 'title' not in request.session:
            request.session['title'] = GROUPGRADER_TITLE

        andrew = GROUPGRADER_USERS.split(":")[0]
        gmail = GROUPGRADER_USERS.split(":")[1]
        if not (request.user.email.endswith(andrew) or request.user.email.endswith(gmail)):
            message = f"You must use an e-mail address ending with {GROUPGRADER_USERS}"
            context["message"] = message
            return render(request, 'groupgrader/home.html', context)

        # Check identity as Student or Grader here
        if Student.objects.filter(user=request.user):
            return redirect("student-dashboard")
        elif Grader.objects.filter(user=request.user):
            return redirect("grader-dashboard")
        else:
            message = "Please select an identity: Student or Grader."
            context["message"] = message
            context['logged_in'] = "True"
            return render(request, "groupgrader/home.html", context)
    
    # POST
    if (request.user.id == None):
        message = "Welcome! Please log in!"
        context["message"] = message
        return render(request, "groupgrader/home.html", context)
    
    if 'title' not in request.session:
        request.session['title'] = GROUPGRADER_TITLE

    # Check email
    andrew = GROUPGRADER_USERS.split(":")[0]
    gmail = GROUPGRADER_USERS.split(":")[1]
    if not (request.user.email.endswith(andrew) or request.user.email.endswith(gmail)):
        message = f"You must use an e-mail address ending with {GROUPGRADER_USERS}"
        context["message"] = message
        return render(request, 'groupgrader/home.html', context)

    context['logged_in'] = "True"
    if ("nickname" not in request.POST) or ("identity" not in request.POST):
        return render(request, "groupgrader/home.html", context)
    nickname = request.POST.get("nickname")
    context['nickname'] = nickname
    identity = request.POST.get("identity")
    if (nickname == "" or len(nickname) > 50 or identity not in {"student", "grader"}):
        message = "Invalid input. Please select an identity: Student or Grader."
        context["message"] = message
        context['logged_in'] = "True"
        return render(request, "groupgrader/home.html", context)

    # Transaction point
    if (identity == "student"):
        item = Student(user=request.user, nickname=nickname)
        item.save()
        return redirect("student-dashboard")
    elif (identity == "grader"):
        item = Grader(user=request.user, nickname=nickname)
        item.save()
        return redirect("grader-dashboard")
    else:
        message = "Invalid input. Please select an identity: Student or Grader."
        context["message"] = message
        context['logged_in'] = "True"
        return render(request, "groupgrader/home.html", context)


# This is for testing purpose only!
# Not online
@login_required
@_general_check
def swicth_identity_action(request):
    if Student.objects.filter(user=request.user):
        item = Student.objects.get(user=request.user)
        nickname = item.nickname
        user = item.user
        item.delete()
        new_item = Grader(user=user, nickname=nickname)
        new_item.save()
        return redirect("grader-dashboard")
    elif Grader.objects.filter(user=request.user):
        item = Grader.objects.get(user=request.user)
        nickname = item.nickname
        user = item.user
        item.delete()
        new_item = Student(user=user, nickname=nickname)
        new_item.save()
        return redirect("student-dashboard")


# Return a pdf file as file response or 404
@login_required
@_general_check
def get_pdf(request, assn_id):
        
    # Only grader or the owner can access it
    item = get_object_or_404(Assignment, id=assn_id)

    if not item.assignment:
        raise Http404

    # Access control for authorization
    if (Student.objects.filter(user=request.user)) and (item.user!=request.user) and (item.is_rubric==False):
        raise Http404

    return FileResponse(item.assignment, as_attachment=False,
    content_type='application/pdf')


# Return the rubric
@login_required
@_general_check
def get_rubric(request, assn_id):
        
    item = get_object_or_404(Assignment, id=assn_id)

    if not item.rubric:
        raise Http404
    
    # Access control for authorization
    if (Student.objects.filter(user=request.user)) and (item.user!=request.user) and (item.is_rubric==False):
        raise Http404

    return HttpResponse(item.rubric, content_type='application/json')

# Called by assignment.html and assignmentGrading.html
@login_required
@_general_check
def get_rubric_pages(request, assn_id):
        
    item = get_object_or_404(Assignment, id=assn_id)

    if not item.rubric:
        raise Http404
    if not item.pages:
        raise Http404
    
    # Access control for authorization
    if (Student.objects.filter(user=request.user)) and (item.user!=request.user) and (item.is_rubric==False):
        raise Http404

    response_data = {"rubric":item.rubric, "pages":item.pages, "submit_date":item.submit_date.isoformat(), "name":item.user.username}
    return HttpResponse(json.dumps(response_data), content_type='application/json')

###############################################################################
# Functions for Grader
###############################################################################

# Render dashboard.html
@login_required
@_grader_check
def grader_dashboard_action(request):
    context = {}
    nickname = Grader.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    return render(request, "groupgrader/grader/dashboard.html", context)


# Render course.html
@login_required
@_grader_check
def grader_course_action(request, id):
    course_num=id
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        return render(request, "groupgrader/grader/dashboard.html", 
                        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    context = {}
    course = get_object_or_404(Course, course_num=course_num)
    context['course'] = course
    nickname = Grader.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    return render(request, 'groupgrader/grader/course.html', context)


# Render assignment.html
@login_required
@_grader_check
def grader_assignment_action(request, assn):
    if not Assignment.objects.filter(id=assn):
        # Error handling here!
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    assignment = get_object_or_404(Assignment, id=assn)
    course = assignment.course
    context = {"course": course, "assignment": assignment}
    all_enrolled_students = course.students.all()
    allEnrolledCnt = len(all_enrolled_students)
    submissionCnt = get_submission_cnt(assignment)
    nickname = Grader.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    context["enrolled_students"] = all_enrolled_students
    context["not_released"] = not assignment.is_released
    print(submissionCnt)
    print(allEnrolledCnt)
    context["all_submitted"] = (submissionCnt >= allEnrolledCnt)
    return render(request, "groupgrader/grader/assignmentSummary.html", context)


# Render AssignmentGrading.html
@login_required
@_grader_check
def grader_grade_action(request, assn_id, from_group_grading):
    if not Assignment.objects.filter(id=assn_id):
        # Error handling here!
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    if from_group_grading not in {0,1}:
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error! URL is modified!", "nickname":Grader.objects.get(user=request.user).nickname})
    assignment = get_object_or_404(Assignment, id=assn_id)
    course = assignment.course
    context = {"course": course, "assignment": assignment}
    nickname = Grader.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    if from_group_grading == 1:
        context["from_group_grading"] = True
    elif from_group_grading == 0:
        context["from_group_grading"] = False
    else:
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error! URL is modified!", "nickname":Grader.objects.get(user=request.user).nickname})
    return render(request, "groupgrader/grader/assignmentGrading.html", context)


# Return a json! AJAX POST
# Grade transaction point.
@login_required
@_grader_check
def grader_grade_submit_action(request, assn_id):
    if request.method == 'GET':
        raise Http404
    if not Assignment.objects.filter(id=assn_id):
        # Error handling here!
        return render(request, "groupgrader/grader/dashboard.html",
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    
    assignment = get_object_or_404(Assignment, id=assn_id)
    try: 
        score_breakdown = request.POST["json"]
        total_score = request.POST["total_score"]
        total_score = int(total_score)
    except: 
        raise Http404
    if (total_score < 0):
        raise Http404
    original = json.loads(assignment.rubric)
    new = json.loads(score_breakdown)
    original.update(new)
    assignment.rubric = json.dumps(original)
    assignment.total_score= total_score
    assignment.is_graded = True
    assignment.save()

    response_json = json.dumps({"assn_id":assn_id})
    return HttpResponse(response_json, content_type='application/json')


# POST
@login_required
@_grader_check
def grader_release_score_action(request, course_num, assn_name):
    if request.method == 'GET':
        raise Http404
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        raise Http404
    if not Assignment.objects.filter(name=assn_name):
        # Error handling here!
        raise Http404
    course = Course.objects.get(course_num=course_num)
    all_graded = Assignment.objects.filter(course=course).filter(name=assn_name).filter(active_version=True)
    for model_graded in all_graded:
        if not (Student.objects.filter(user=model_graded.user)):
            continue
        if not model_graded.is_graded:
            model_graded.total_score = 0
            model_graded.is_graded = True
        model_graded.is_released = True
        model_graded.save()
    
    rubric_assn = Assignment.objects.filter(course=course).filter(name=assn_name).get(is_rubric=True)
    rubric_assn.is_released = True
    rubric_assn.save()
    
    return redirect("grader-course", course_num)


# Important POST
# Lots of validation security checks are performed
# to ensure the integrity of Assignment model.
@login_required
@_grader_check
def create_assignment_action(request, id):

    course_num = id
    if not Course.objects.filter(course_num=course_num):
        raise Http404
    
    if "json" not in request.POST:
        raise Http404

    try:
        json_rubric = request.POST["json"]
        # Validation check for rubric field
        if len(json_rubric) > 1000:
            raise Http404
    except:
        raise Http404
    my_dict = json.loads(json_rubric)

    new_assn = Assignment()
    this_course = get_object_or_404(Course, course_num=course_num)

    new_assn.course = this_course        
    new_assn.user = request.user
    new_assn.rubric = json_rubric
    new_assn.name = my_dict['id_assignment_name']

    # Validation check
    if len(my_dict['id_assignment_name']) > 30 or len(my_dict['id_assignment_name']) == 0:
        raise Http404
    
    course = Course.objects.get(course_num=course_num)
    if Assignment.objects.filter(course=course).filter(name=my_dict['id_assignment_name']):
        raise Http404

    try:
        valid_datetime = datetime.strptime(my_dict['id_due_date'], '%Y-%m-%dT%H:%M')
        tz = timezone.get_current_timezone()
        valid_datetime = valid_datetime.replace(tzinfo=tz)
        # my_dict['id_due_date'] must exists

    except:
        print(my_dict['id_due_date'])
        raise Http404
    new_assn.due_date = valid_datetime

    if (my_dict['id_assignment_total_score'] == ""):
        new_assn.total_score = 0
        new_assn.full_score = 0
    else:
        try: 
            new_assn.total_score = int(my_dict['id_assignment_total_score'])
            new_assn.full_score = int(my_dict['id_assignment_total_score'])
        except: 
            raise Http404
    new_assn.is_released = False
    new_assn.active_version = True
    new_assn.is_submitted = False
    new_assn.is_rubric = True
    if ('PDF' in request.FILES):
        name_of_file = str(request.FILES['PDF'])
        if name_of_file.endswith('.pdf'):
            new_assn.assignment = request.FILES['PDF']
        else:
            raise Http404

    new_assn.save()
    print(new_assn.total_score)
    print(new_assn.full_score)

    return redirect("list-assignment-grader", id)


# AJAX GET function
# For assignment.html
@login_required
@_grader_check
def list_assignment_grader_action(request, id):

    course_num = id
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    course = Course.objects.get(course_num=course_num)
    
    grader_assignments = Assignment.objects.filter(course=course).filter(is_rubric=True)
    response_data = {"assignments":[], "identity":"grader"}
    for model_assignment in grader_assignments:
        my_assignment = {
            'id': model_assignment.id,
            'name': model_assignment.name,
            'due_date': model_assignment.due_date.isoformat(),
            'submission_cnt': get_submission_cnt(model_assignment),
            'graded_perc': get_graded_perc(model_assignment),
            'published': model_assignment.is_released,
            'graded': model_assignment.is_graded,
        }
        response_data['assignments'].append(my_assignment)
    response_json = json.dumps(response_data)
    return HttpResponse(response_json, content_type='application/json')

# helper
def get_submission_cnt(assignment):
    assignments = Assignment.objects.filter(course=assignment.course).filter(name=assignment.name).filter(is_submitted=True).filter(active_version=True)
    return len(assignments)
# helper
def get_graded_cnt(assignment):
    assignments = Assignment.objects.filter(course=assignment.course).filter(name=assignment.name).filter(is_graded=True)
    return len(assignments)
# helper
def get_graded_perc(assignment):
    graded_cnt = get_graded_cnt(assignment)
    submission_cnt = get_submission_cnt(assignment)
    if submission_cnt == 0:
        return 0
    return int((graded_cnt/submission_cnt) * 100)


# Render a page
# Modify Grader's Student Many-to-Many field
# Return assignmentSummaryGrouped.html
@login_required
@_grader_check
def group_grading_action(request, course_num, assn_id):
        
    if not Course.objects.filter(course_num=course_num):
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Groupgrading Error !", "nickname":Grader.objects.get(user=request.user).nickname})
    if not Assignment.objects.filter(id=assn_id):
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Groupgrading Error !", "nickname":Grader.objects.get(user=request.user).nickname})
    
    # Redirect from final grading page
    if request.method == 'GET':
        curr_assignment = Assignment.objects.get(id=assn_id)
        curr_course = Course.objects.get(course_num=course_num)
        curr_grader = Grader.objects.get(user=request.user)

        context = {"course": curr_course, "assignment": curr_assignment}
        nickname = curr_grader.nickname
        context["nickname"] = nickname

        return render(request, "groupgrader/grader/assignmentSummaryGrouped.html", context)
    
    curr_assignment = Assignment.objects.get(id=assn_id)
    curr_course = Course.objects.get(course_num=course_num)
    curr_grader = Grader.objects.get(user=request.user)

    # Need all enrolled students to create group grading form
    context = {"course": curr_course, "assignment": curr_assignment, "enrolled_students": []}
    curr_grader.students.clear()
    for student in curr_course.students.all():
        stuID = student.user_id
        stuSelectKey = f"group_selected_{stuID}"
        if stuSelectKey in request.POST: # the student is included in the grader's group
            curr_grader.students.add(student)
            context["enrolled_students"].append(student)
            curr_grader.save()
    nickname = curr_grader.nickname
    context["nickname"] = nickname

    return render(request, "groupgrader/grader/assignmentSummaryGrouped.html", context)


# Only used by group grading
@login_required
@_grader_check
def get_enrolled_students(request, course_num):
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    course = get_object_or_404(Course, course_num=course_num)
    enrolled_students = course.students.all()
    response_data = []
    for model_student in enrolled_students:
        my_student = {"student_id": model_student.user_id,
                      "student_name": model_student.nickname
                      }
        response_data.append(my_student)
    response_json = json.dumps(response_data)
    return HttpResponse(response_json, content_type='application/json')


# AJAX GET
# For assignmentSummary.html
@login_required
@_grader_check
def list_submission_grader_action(request, course_num, assn_name):
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        raise Http404
    if not Assignment.objects.filter(name=assn_name):
        # Error handling here!
        raise Http404
    course = Course.objects.get(course_num=course_num)
    all_assignments = Assignment.objects.filter(course=course).filter(name=assn_name)
    submissions = all_assignments.filter(is_submitted=True).filter(active_version=True)
    response_data = {'submissions':[]}
    for model_submission in submissions:
        if (Grader.objects.filter(user=model_submission.user)):
            # make sure it's a student submission
            continue
        student = Student.objects.get(user=model_submission.user)
        print(model_submission.is_graded)
        if model_submission.is_graded == False:
            score = "Ungraded"
        else:
            score = str(model_submission.total_score)+"/"+str(model_submission.full_score)
        my_submission = {
            'student_id': student.nickname,
            'submission_id': model_submission.id,
            'graded': model_submission.is_graded,
            'score': score,
            'submission_time': model_submission.submit_date.isoformat(),
        }
        response_data['submissions'].append(my_submission)
    return HttpResponse(json.dumps(response_data), content_type='application/json')


# AJAX GET
# This is used only for group grading
# It differs in that it passes an extra parameter to html
# For groupedAssignmentSummary.html
@login_required
@_grader_check
def list_grouped_submission_grader_action(request, course_num, assn_name):
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        raise Http404
    if not Assignment.objects.filter(name=assn_name):
        # Error handling here!
        raise Http404
    course = Course.objects.get(course_num=course_num)
    all_assignments = Assignment.objects.filter(course=course).filter(name=assn_name)
    submissions = all_assignments.filter(is_submitted=True).filter(active_version=True)
    currGrader = Grader.objects.get(user=request.user)
    groupStudents = currGrader.students.all()
    response_data = {'submissions':[]}

    # This is to exclude all students who have already submitted asignment
    exclude = set()
    for model_submission in submissions:
        if not (Grader.objects.filter(user=model_submission.user)):
            if not (groupStudents.filter(user=model_submission.user)):
                continue
            student = Student.objects.get(user=model_submission.user)
            if model_submission.is_graded == False:
                score = "Ungraded"
            else:
                score = str(model_submission.total_score)+"/"+str(model_submission.full_score)
            exclude.add(model_submission.user)
            my_submission = {
                'student_id': student.nickname,
                'submission_id': model_submission.id,
                'graded': model_submission.is_graded,
                'score': score,
                'submission_time': model_submission.submit_date.isoformat(),
            }
            response_data['submissions'].append(my_submission)

    # Loop for students who have not submitted assignment
    for selected_students in groupStudents:
        if selected_students.user in exclude:
            continue
        my_submission = {
            'student_id': selected_students.nickname,
            'submission_id': "Not submitted yet",
        }
        response_data['submissions'].append(my_submission)

    return HttpResponse(json.dumps(response_data), content_type='application/json')


# POST!
@login_required
@_grader_check
def create_course_action(request):
    if request.method == 'GET':
        raise Http404

    new_course = Course()
    new_course.user = request.user

    # Validate
    try:
        new_course.course_name = request.POST['course_name']
        if len(request.POST['course_name']) > 60:
            raise Http404
        new_course.course_bio = request.POST['course_bio']
        if len(request.POST['course_bio']) > 200:
            raise Http404
        tmp_num = int(request.POST['course_num'])
    except:
        raise Http404
    new_course.course_num = tmp_num
    new_course.course_color = request.POST['course_color']

    if Course.objects.filter(course_num=tmp_num):
        raise Http404

    new_course.save()
    curr_grader = Grader.objects.get(user=request.user)
    new_course.graders.add(curr_grader)
    new_course.save()

    return redirect("list-course-grader")


# POST
@login_required
@_grader_check
def grader_enroll_course_action(request):
    if request.method == 'GET':
        raise Http404
    
    try:
        course_num = int(request.POST['course_num'])
    except:
        raise Http404
    
    if not Course.objects.filter(course_num=course_num):
        raise Http404

    course = Course.objects.get(course_num=course_num)
    curr_grader = Grader.objects.get(user=request.user)
    course.graders.add(curr_grader)
    course.save()
    return redirect("list-course-grader")


# AJAX POST
# For dashboard.html
@login_required
@_grader_check
def list_course_grader_action(request):
    response_data = {"courses": []}
    curr_grader = Grader.objects.get(user=request.user)
    all = Course.objects.filter(graders=curr_grader)
    for model_course in all:
        my_course = {
            'id': model_course.id,
            'course_name': model_course.course_name,
            'course_num': model_course.course_num,
            'course_color': model_course.course_color,
        }
        response_data['courses'].append(my_course)
    response_json = json.dumps(response_data)
    return HttpResponse(response_json, content_type='application/json')


# For statistic page
@login_required
@_grader_check
def statistics_grader_action(request, course_num, assn_name):
    if not Course.objects.filter(course_num=course_num):
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    if not Assignment.objects.filter(name=assn_name):
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})

    course = Course.objects.get(course_num=course_num)
    # guaranteed to be only be one
    rubric = Assignment.objects.filter(course=course).filter(name=assn_name).filter(is_rubric=True).get(active_version=True)
    total_score = rubric.total_score
    students = Assignment.objects.filter(course=course).filter(name=assn_name).filter(is_submitted=True).filter(active_version=True)
    total = 0
    
    for student_assn in students:
        total += student_assn.total_score
    
    # Avoid division by zero
    if total_score == 0:
        stat = 0
    else:
        stat = (total/len(students))

    context = {"course": course, "assignment": rubric}
    nickname = Grader.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    if rubric.is_released:
        context["statistics"] = " Average : "+str(stat) + " out of " + str(total_score)
    else:
        context["statistics"] = "Not finished grading/releasing grade yet"
    enrolledStuCnt = len(course.students.all())
    submittedCnt = len(students)
    context["missing_submission"] = enrolledStuCnt - submittedCnt
    context["enrolled_students"] = course.students.all()
    context["not_released"] = not rubric.is_released

    return render(request, "groupgrader/grader/statistic.html", context)


# POST
@login_required
@_grader_check
def grader_leave_course_action(request, num):
    
    course_num = num
    if not Course.objects.filter(course_num=course_num):
        return render(request, "groupgrader/grader/dashboard.html", 
        context={"error":"Error!", "nickname":Grader.objects.get(user=request.user).nickname})
    
    course = Course.objects.get(course_num=course_num)
    curr_grader = Grader.objects.get(user=request.user)
    course.graders.remove(curr_grader)
    return redirect("grader-dashboard")


###############################################################################
# Functions for Student
###############################################################################

# Render dashboard.html
@login_required
@_student_check
def student_dashboard_action(request):
    context = {}
    context["dashboard_message"] = "Click on one of your courses to the right, or on the Account menu below."
    nickname = Student.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    return render(request, "groupgrader/student/dashboard.html", context)


# Render course.html
@login_required
@_student_check
def student_course_action(request, id):
    course_num=id
    if not Course.objects.filter(course_num=course_num):
        return render(request, "groupgrader/student/dashboard.html", 
        context={"error":"Error!", "nickname":Student.objects.get(user=request.user).nickname})
    context = {}
    course = get_object_or_404(Course, course_num=course_num)
    context['course'] = course
    nickname = Student.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    return render(request, 'groupgrader/student/course.html', context)


# Render assignment.html
@login_required
@_student_check
def student_assignment_action(request, assn):

    if not Assignment.objects.filter(id=assn):
        return render(request, "groupgrader/student/dashboard.html",  
        context={"error":"Error!", "nickname":Student.objects.get(user=request.user).nickname})
    
    context = {}
    assignment = Assignment.objects.get(id=assn)

    context["assignment"] = assignment
    context["course_num"] = assignment.course.course_num
    nickname = Student.objects.get(user=request.user).nickname
    context["nickname"] = nickname
    return render(request, "groupgrader/student/assignment.html", context)


# POST
# Called from course.html to submit an assignment
@login_required
@_student_check
def submit_assignment_action(request, rubric_id):
    if request.method == 'GET':
        raise Http404
    
    if (not 'PDF' in request.FILES):
        raise Http404
    
    if (not Assignment.objects.filter(id=rubric_id)):
        raise Http404
    
    rubric_assn = Assignment.objects.get(id=rubric_id)

    if (not rubric_assn.is_rubric):
        raise Http404

    new_assn = Assignment()
    name_of_file = str(request.FILES['PDF'])
    # Validate File type to be PDF
    if name_of_file.endswith('.pdf'):
        new_assn.assignment = request.FILES['PDF']
    else:
        raise Http404
    new_assn.rubric = rubric_assn.rubric
    new_assn.user = request.user
    new_assn.course = rubric_assn.course
    new_assn.due_date = rubric_assn.due_date
    new_assn.name = rubric_assn.name
    new_assn.is_graded = False
    new_assn.is_released = False
    new_assn.is_submitted = True
    new_assn.rubric = rubric_assn.rubric

    # This is to set page count by default!!
    counter = 1
    pages = {}
    while(True):
        if (not (f"id_input_question_num_#{counter}" in json.loads(rubric_assn.rubric))): break
        pages[f"Q{counter}start"] = 1
        pages[f"Q{counter}end"] = 1
        counter += 1
    new_assn.pages = json.dumps(pages)

    new_assn.total_score = rubric_assn.total_score
    new_assn.full_score = rubric_assn.full_score

    new_assn.submit_date = timezone.now()
    new_assn.active_version = True

    new_assn.save()    
    response_json = json.dumps({"assn_id":new_assn.id})
    return HttpResponse(response_json, content_type='application/json')


# POST
# Called from course.html to resubmit an assignment
@login_required
@_student_check
def resubmit_assignment_action(request, prev_id):

    if request.method == 'GET':
        raise Http404
    
    if (not 'PDF' in request.FILES):
        raise Http404
    
    if (not Assignment.objects.filter(id=prev_id)):
        raise Http404
    
    prev_assn = Assignment.objects.get(id=prev_id)
    print(prev_assn)

    if (prev_assn.user != request.user):
        raise Http404

    if (not prev_assn.active_version):
        raise Http404

    if (prev_assn.is_graded):
        raise Http404
    

    # We create a new Assignment because we want to keep track of old assignments.
    new_assn = Assignment()
    name_of_file = str(request.FILES['PDF'])
    if name_of_file.endswith('.pdf'):
        new_assn.assignment = request.FILES['PDF']
    else:
        raise Http404
    new_assn.rubric = prev_assn.rubric
    new_assn.user = request.user
    new_assn.course = prev_assn.course
    new_assn.due_date = prev_assn.due_date
    new_assn.name = prev_assn.name
    new_assn.is_graded = False
    new_assn.is_released = False
    new_assn.is_submitted = True
    new_assn.rubric = prev_assn.rubric

    # This is to set page count by default!!
    counter = 1
    pages = {}
    while(True):
        if (not (f"id_input_question_num_#{counter}" in json.loads(prev_assn.rubric))): break
        pages[f"Q{counter}start"] = 1
        pages[f"Q{counter}end"] = 1
        counter += 1
    new_assn.pages = json.dumps(pages)

    new_assn.total_score = prev_assn.total_score
    new_assn.full_score = prev_assn.full_score

    new_assn.submit_date = timezone.now()
    new_assn.active_version = True

    new_assn.save()    
    prev_assn.active_version = False

    # This has to save later to avoid fail so early
    prev_assn.save()   
    response_json = json.dumps({"assn_id":new_assn.id})
    print(response_json)
    print(new_assn.total_score)
    print(new_assn.full_score)
    print(prev_assn.total_score)
    print(prev_assn.full_score)
    return HttpResponse(response_json, content_type='application/json')


# POST AJAX
# called by assignment.html
@login_required
@_student_check
def select_page_action(request, assn_id):

    if request.method == 'GET':
        raise Http404
    if (not 'json' in request.POST):
        raise Http404
    
    if (not Assignment.objects.filter(id=assn_id)):
        raise Http404
    
    assn = Assignment.objects.get(id=assn_id)

    if (assn.user != request.user): 
        raise Http404

    if (not assn.active_version):
        raise Http404
    
    # Validate
    try:
        if len(request.POST['json']) > 500:
            raise Http404
        assn.pages = request.POST['json']
        assn.save()   
    except:
        raise Http404

    response_json = json.dumps({"course_num":assn.course.course_num})
    return HttpResponse(response_json, content_type='application/json')


# POST AJAX for course page
@login_required
@_student_check
def list_assignment_student_action(request, id):

    course_num = id
    if not Course.objects.filter(course_num=course_num):
        raise Http404
    course = Course.objects.get(course_num=course_num)
    
    response_data = {"assignments": [], "identity":"student"}
    exclude = set()

    #  Both released (unsubmitted) assignments and submitted assignments (is_submitted = True, active_version=True)
    submitted_assignments = (Assignment.objects.filter(course=course).filter(user=request.user).filter(active_version=True).filter(is_rubric = False))
    for model_assignment in submitted_assignments:
        if model_assignment.is_released:
            status = "Score: " + str(model_assignment.total_score)+"/"+str(model_assignment.full_score)
        elif model_assignment.is_graded:
            status = "Graded. Waiting to be released."
        else:
            status = "Ungraded"
        my_assignment = {
            'id': model_assignment.id,
            'name': model_assignment.name,
            'due_date': model_assignment.submit_date.isoformat(),
            'status': status,
            'is_submitted' : True
        }
        exclude.add(model_assignment.name)
        response_data['assignments'].append(my_assignment)


    released_assignments = Assignment.objects.filter(course=course).filter(is_rubric = True)
    
    for model_assignment in released_assignments:
        if model_assignment.name in exclude:
            continue

        my_assignment = {
            'id': model_assignment.id,
            'name': model_assignment.name,
            'due_date': model_assignment.due_date.isoformat(),
            'status': "Not Submitted",
            'is_submitted' : False
        }
        response_data['assignments'].append(my_assignment)
    response_json = json.dumps(response_data)
    return HttpResponse(response_json, content_type='application/json')


# POST AJAX for dashbaord page
@login_required
@_student_check
def list_course_student_action(request):
    response_data = {"courses": []}
    curr_student = Student.objects.get(user=request.user)
    all = Course.objects.filter(students=curr_student)
    for model_course in all:
        my_course = {
            'id': model_course.id,
            'course_name': model_course.course_name,
            'course_num': model_course.course_num,
            'course_color': model_course.course_color,
        }
        response_data['courses'].append(my_course)
    response_json = json.dumps(response_data)
    print(response_json)
    return HttpResponse(response_json, content_type='application/json')


# POST
@login_required
@_student_check
def student_enroll_course_action(request):
    if request.method == 'GET':
        raise Http404
    
    # Validate
    try:
        course_num = int(request.POST['course_num'])
    except:
        raise Http404
    if not Course.objects.filter(course_num=course_num):
        raise Http404
    
    course = Course.objects.get(course_num=course_num)
    curr_student = Student.objects.get(user=request.user)
    course.students.add(curr_student)
    course.save()
    return redirect("list-course-student")


# POST
@login_required
@_student_check
def student_leave_course_action(request, num):
    
    course_num = num
    if not Course.objects.filter(course_num=course_num):
        # Error handling here!
        return render(request, "groupgrader/student/dashboard.html",  
        context={"error":"Error!", "nickname":Student.objects.get(user=request.user).nickname})
    
    course = Course.objects.get(course_num=course_num)
    curr_student = Student.objects.get(user=request.user)
    course.students.remove(curr_student)

    # Reverse accessor!!
    for grader in Grader.objects.filter(students__in=[curr_student]):
        grader.students.remove(curr_student)


    return redirect("student-dashboard")


# Download a pdf
# for downloading handout and downloading original copy
@login_required
@_student_check
def download_pdf(request, assn_id):

    if not Assignment.objects.filter(id=assn_id):
        return render(request, "groupgrader/student/dashboard.html",  
        context={"error":"Error!", "nickname":Student.objects.get(user=request.user).nickname})

    item = get_object_or_404(Assignment, id=assn_id)

    # Access control for authorization
    if (Student.objects.filter(user=request.user)) and (item.user!=request.user) and (item.is_rubric==False):
        return render(request, "groupgrader/student/dashboard.html",  
        context={"error":"Error!", "nickname":Student.objects.get(user=request.user).nickname})

    if not item.assignment:
        return render(request, "groupgrader/student/dashboard.html", 
        context={"error":"Error! No PDF was uploaded for this assignment.", 
        "nickname":Student.objects.get(user=request.user).nickname})
         
    return FileResponse(item.assignment, as_attachment=False,
    content_type='application/pdf')


###############################################################################
# Deprecated Functions
###############################################################################

def test_action(request):
    return render(request,"groupgrader/grader/assignmentSummary.html", {})


def _my_json_error_response(message, status=200):
    response_json = '{"error": "' + message + '"}'
    return HttpResponse(response_json, content_type='application/json', status=status)


@login_required
@_general_check
def get_photo(request, id):
    return
    item = get_object_or_404(Profile, id=id)
    if not item.profile_picture:
        raise Http404
    return HttpResponse(item.profile_picture, content_type=item.content_type)
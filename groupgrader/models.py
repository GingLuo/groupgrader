from django.db import models
from django.contrib.auth.models import User

class Student(models.Model):
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT, related_name="student_user")
    nickname = models.CharField(max_length=50)

    def __str__(self):
        return f'id={self.id}'
    
class Grader(models.Model):
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT, related_name="grader_user")
    nickname = models.CharField(max_length=50)

    # For group grading purpose
    students = models.ManyToManyField(Student, default=None)
    

class Course(models.Model):
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT, related_name="course_creator")
    students = models.ManyToManyField(Student, default=None)
    graders = models.ManyToManyField(Grader, default=None)

    course_num = models.IntegerField(blank=False)
    course_bio = models.CharField(max_length=200)
    course_name = models.CharField(max_length=60)
    course_color = models.CharField(max_length=50, default="#FFFFFF")


# Assignment for grader is the writeup that can be downloaded by students
# Assignment for students is individual submission for preview and review
# This is an important model where it uses JSON string field to transmit grades between grader and students
# See "Project Backlog 0322.pdf" for more information on our design.
class Assignment(models.Model):
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT, related_name="assign_user")
    course = models.ForeignKey(Course, default=None, on_delete=models.PROTECT, related_name="assign_course")

    due_date = models.DateTimeField(blank=False)
    submit_date = models.DateTimeField(auto_now_add=True, blank=True)
    name = models.CharField(default="", max_length=30, blank=True)
    
    total_score = models.IntegerField(default=0, blank=True)
    full_score = models.IntegerField(default=0, blank=True)

    assignment = models.FileField(default=None, blank=True)
    is_graded = models.BooleanField(default=False)
    is_rubric = models.BooleanField(default=False)

    # Whether the grade is released or not.
    is_released = models.BooleanField(default=False)  

    # Rubric assignment is a fake assignment, so its is_submitted = False
    is_submitted = models.BooleanField(default=False)

    active_version = models.BooleanField(default=False)

    # These two are JSON strings
    rubric = models.CharField(default="", max_length=1000)
    pages = models.CharField(default="", max_length=500)
    
    def __str__(self):
        return f'id={self.id}'



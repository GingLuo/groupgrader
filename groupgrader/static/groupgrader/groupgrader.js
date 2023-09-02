/**
###############################################################
# 17437 Final Project - Group Grader
# Author: Ging Luo (yichuanl@andrew.cmu.edu), Ran Fang (ranf@andrew.cmu.edu)
# Date: 04/23/2023
###############################################################
 */

/** 
 * ###############################################################################
 * #  AJAX GET Request Functions
 * ###############################################################################
 */
// NOTE:
// These functions send AJAX using xhr.
// We used these before we learned JQuery. 


// Update the grader's assignment list
function getGraderAssignmentList(course_id) {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) return
        updateCoursePage(xhr)
    }

    xhr.open("GET", `/groupgrader/list-assignment-grader/${course_id}`, true)
    xhr.send()
}


// Update the student's assignment list
function getStudentAssignmentList(course_id) {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
        if (this.readyState !== 4) return
        updateCoursePage(xhr)
    }

    xhr.open("GET", `/groupgrader/list-assignment-student/${course_id}`, true)
    xhr.send()
}

// We then learned JQuery, and the main part of this file is completed with jquery.

// Update submission list for assignmentSummary.html
function getSubmissionList(course_num, assn_name) {
    $.ajax({
        url: `/groupgrader/list-submission-grader/${course_num}/${assn_name}`,
        dataType: "json",
        success: updateSubmissionList,
        error: updateError
        }
    );
}


// Update submission list for groupAssignmentSummary.html
function getGroupSubmissionList(course_num, assn_name) {
    $.ajax({
        url: `/groupgrader/list-grouped-submission-grader/${course_num}/${assn_name}`,
        dataType: "json",
        success: updateGroupSubmissionList,
        error: updateError
        }
    );
}


// Update course list for grader dashboard
function getGraderCourseList() {
    $.ajax({
        url: "/groupgrader/list-course-grader",
        dataType : "json",
        success: updateCourseList,
        error: updateError
    });
}


// Update course list for student dashboard
function getStudentCourseList() {
    $.ajax({
        url: "/groupgrader/list-course-student",
        dataType : "json",
        success: updateCourseList,
        error: updateError
    });
}

/** 
 * #  AJAX GET Request Functions
 * #  These functions also updates modal forms
 */

// Dynamically make grading form on assignmentGrading page
function makeGradingForm(assn_id, from_group_grading){
    console.log(from_group_grading)
    var flag = 0
    if (from_group_grading){
        flag = 1
    }
    displayError('')
    $.ajax({
        url: `/groupgrader/get-rubric-pages/${assn_id}`,
        type: "GET",
        success: function(response){
            var body = $("#id_grader_grading_form")
            var rubric = JSON.parse(response["rubric"])
            var pages = JSON.parse(response["pages"])
            var full_score = rubric['id_assignment_total_score']
            body.append(`<p1 class='lead'>Total Score: ${full_score}</p1>`)
            body.append("<hr>")
            var counter = 1
            while(true){
                if (!(`id_input_question_num_#${counter}` in rubric)) break
                body.append(makeGradingFormHelper(rubric, pages, counter))
                counter ++
                body.append(`<hr>`)
            }
            body.append(`<div class="mb-3">
            <button type="button" class="btn btn-light" onclick="submitGradedRubric('${assn_id}','${full_score}','${flag}')">Finish Grading</button>
            </div>`)
        },
        error: updateError
    });
}
    

// Dynamically make page selection form on assignment page
function makeSelectPageModal(assn_id){

    displayError('')

    $.ajax({
        url: `/groupgrader/get-rubric/${assn_id}`,
        type: "GET",
        success: function(response){
            var body = $("#id_submit_assignment_form")
            var rubric = response // Already an object
            var counter = 1
            while(true){
                if (!(`id_input_question_num_#${counter}` in rubric)) break
                body.append(`<div class="row mb-2" data-id="1">
                Q${counter}: From &nbsp;<input type="number" min_value="0" class="form-control" name="Q${counter}start" value="" style="width:20%;">&nbsp; 
                to &nbsp;<input type="number"  min_value="0" class="form-control" name="Q${counter}end" value="" style="width:20%;">
            </div>`)
                counter ++
            }
        },
        error: updateError
    });

}


// Dynamically make score breakdown form on assignment page
function makeScoreBreakDown(assn_id){
    displayError('')

    $.ajax({
        url: `/groupgrader/get-rubric-pages/${assn_id}`,
        type: "GET",
        success: function(response){
            var body = $("#id_score_breakdown")
            var rubric = JSON.parse(response["rubric"])
            var pages = JSON.parse(response["pages"])
            var counter = 1
            console.log(rubric)
            console.log(pages)
            while(true){
                if (!(`id_input_question_num_#${counter}` in rubric)) break
                body.append(makeScoreBreakDownHelper(rubric, pages, counter))
                body.append(`<hr style="border-color: rgb(76, 160, 240);">`)
                counter ++
                console.log(body)
            }
            console.log(body)
        },
        error: updateError
    });
}



/** 
 * ###############################################################################
 * #  Helper Functions
 * ###############################################################################
 */

// For updatecourse AJAX. Not jquery.
// Future: Change this to JQUery
function updateCoursePage(xhr) {
    if (xhr.status === 200) {
        let response = JSON.parse(xhr.responseText)
        updateAssignmentList(response)
        return
    }

    if (xhr.status === 0) {
        displayError("Cannot connect to server")
        return
    }

    if (!xhr.getResponseHeader('content-type') === 'application/json') {
        displayError(`Received status = ${xhr.status}`)
        return
    }

    let response = JSON.parse(xhr.responseText)
    if (response.hasOwnProperty('error')) {
        displayError(response.error)
        return
    }

    displayError(response)
}

// https://github.com/cmu-webapps/jquery-example/blob/master/jquery_todolist/static/jquery_todolist/todo.js
// Sanitize input
function sanitize(s) {
    // Be sure to replace ampersand first
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
}


// Helper function to correct invalid input value
function checkValue(sender) {
    let min = sender.min
    let max = sender.max;
    let value = parseInt(sender.value)
    if (max && value > max) {
        sender.value = max
    } else if (min && value < min) {
        sender.value = min
    }
}


// Error handling function for AJAX
function updateError(xhr) {
    console.log("Met an error: updateError")
    if (xhr.status === 0) {
        displayError("Error")
        return
    }

    if (!xhr.getResponseHeader('content-type') === 'application/json') {
        displayError("Received status=" + xhr.status)
        return
    }

    displayError(" Error updateError!")
}

function displayError(message) {
    $("#error").html(message);
}


// Helper function for generating CSRF token
function getCSRFToken() {
    let cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim()
        if (c.startsWith("csrftoken=")) {
            return c.substring("csrftoken=".length, c.length)
        }
    }
    return "unknown"
}

// Download PDF
// By student on course page
function downloadPDF(id) {
    window.open(`/groupgrader/download-pdf/${id}`);
}

// Redirect after sucessfully submitting assignment
function redirect_student_assignment_page(response){

    console.log(response)
    window.location.replace(`/groupgrader/student-assignment/${response.assn_id}`);

}

/** 
 * ###############################################################################
 * #  AJAX POST Request Functions
 * ###############################################################################
 */

// Make html for grader's assignment page
function createCourse() {
    let courseNameElement = $("#id_input_course_name")
    let courseNameValue   = courseNameElement.val()
    let courseNumElement = $("#id_input_course_num")
    let courseNumValue   = courseNumElement.val()
    let courseBioElement = $("#id_input_course_bio")
    let courseBioValue   = courseBioElement.val()
    let courseColorElement = $("#id_input_course_color")
    let courseColorValue = courseColorElement.val()
    console.log(courseColorValue)

    // Clear input box and old error message (if any)
    courseNameElement.val('')
    courseNumElement.val('')
    courseBioElement.val('')
    displayError('');

    $.ajax({
        url: "/groupgrader/create-course",
        type: "POST",
        data: `course_name=${courseNameValue}&course_num=${courseNumValue}&course_bio=${courseBioValue}&course_color=${courseColorValue}&csrfmiddlewaretoken=${getCSRFToken()}`,
        dataType : "json",
        success: updateCourseList,
        error: updateError
    });
}


// Enroll student for a course
function enrollCourseStudent() {
    let courseNumElement = $("#id_input_course_num_enroll")
    let courseNumValue   = courseNumElement.val()

    // Clear input box and old error message (if any)
    courseNumElement.val('')
    displayError('');

    $.ajax({
        url: "/groupgrader/enroll-course-student",
        type: "POST",
        data: `course_num=${courseNumValue}&csrfmiddlewaretoken=${getCSRFToken()}`,
        dataType : "json",
        success: updateCourseList,
        error: updateError
    });
}

// Enroll grader for a course
function enrollCourseGrader() {
    let courseNumElement = $("#id_input_course_num_enroll")
    let courseNumValue   = courseNumElement.val()

    courseNumElement.val('')
    displayError('');

    $.ajax({
        url: "/groupgrader/enroll-course-grader",
        type: "POST",
        data: `course_num=${courseNumValue}&csrfmiddlewaretoken=${getCSRFToken()}`,
        dataType : "json",
        success: updateCourseList,
        error: updateError
    });
}


// Create a assignment by grader on assignment page
function createAssignment(course_num) {

    let data = {};
    let value = $('#id_create_assignment_form').serializeArray();
    let total_score = 0
    $.each(value, function (index, item) {
        data[item.name] = item.value;
        if (item.name.startsWith('id_input_total_score')) {
            // NOTE: Allow over score of individual problem
            total_score += parseInt(item.value)
        }
    });
    let json = JSON.stringify(data);

    let full_score = data["id_assignment_total_score"]

    if (total_score != full_score){
        displayError("Sub-questions need to sum up to total score.")
        return
    }

    console.log("Create Assignment")
    console.log(json)

    // File is verified on the backend
    var PDFFile = $('#id_grader_assn_file').get(0).files[0];
    var formData = new FormData();
    formData.append('PDF', PDFFile);
    formData.append('json', json);
    formData.append('csrfmiddlewaretoken', getCSRFToken())
    console.log(formData)

    displayError('')

    $.ajax({
        url: `/groupgrader/create-assignment/${course_num}`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        cache: false,
        success: updateAssignmentList,
        error: updateError
    });

}


// Submit a assignment by grader on assignment page
function submitAssignment(rubric_id) {

    var PDFFile = $(`#id_assn_file_${rubric_id}`).get(0).files[0];

    // Check PDF file
    console.log(PDFFile)

    var formData = new FormData();
    formData.append('PDF', PDFFile);
    formData.append('csrfmiddlewaretoken', getCSRFToken())

    // Clear input box and old error message (if any)
    displayError('')

    $.ajax({
        url: `/groupgrader/submit-assignment/${rubric_id}`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        cache: false,
        success: redirect_student_assignment_page,
        error: updateError
    });
}


// Resubmit a assignment by grader on assignment page
function resubmitAssignment(prev_id) {

    var PDFFile = $("#id_assn_file").get(0).files[0];
    var formData = new FormData();
    formData.append('PDF', PDFFile);
    formData.append('csrfmiddlewaretoken', getCSRFToken())

    displayError('')

    $.ajax({
        url: `/groupgrader/re-submit-assignment/${prev_id}`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        cache: false,
        success: redirect_student_assignment_page,
        error: displayError("! ")
    });
}


// POST page selection form on assignment page
function selectPage(id){

    let data = {};
    let value = $('#id_submit_assignment_form').serializeArray();
    $.each(value, function (index, item) {
        data[item.name] = item.value;
    });
    var max_page = parseInt($("#page_count").text())
    if (max_page == NaN){
        displayError("Error")
    }
    var counter = 1
    while(true){
        if (!(`Q${counter}start` in data)) break
        var curr = parseInt(data[`Q${counter}start`])
        // console.log(curr)
        if (curr <= 0 || !Number.isInteger(curr) || curr > max_page){
            console.log("here")
            displayError("Error")
            return
        }
        if (data[`Q${counter}end`] == ""){
            console.log("here")
            data[`Q${counter}end`] = data[`Q${counter}start`]
        }
        // console.log(data)
        curr = parseInt(data[`Q${counter}end`])
        if (curr <= 0 || !Number.isInteger(curr) || curr > max_page || curr < parseInt(data[`Q${counter}start`])){
            // console.log("here")
            // console.log(curr)
            displayError("Error")
            return
        }
        counter ++
    }
    let json = JSON.stringify(data);

    console.log(json)

    var formData = new FormData();
    formData.append('json', json);
    formData.append('csrfmiddlewaretoken', getCSRFToken())


    // Clear input box and old error message (if any)
    displayError('')

    $.ajax({
        url: `/groupgrader/select-page/${id}`,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        cache: false,
        success: function(response){
            window.location.replace(`/groupgrader/student-course/${response.course_num}`);
        },
        error: updateError
    });
    
}

// Dynamically make rubric form form on assignment page
function submitGradedRubric(assn_id, raw_full_score, from_group_grading) {
    let data = {};
    let total_score = 0
    let full_score = parseInt(raw_full_score)
    let value = $('#id_grader_grading_form').serializeArray();
    $.each(value, function (index, item) {
        data[item.name] = item.value;
        if (item.name.startsWith('id_input_real_score')) {
            // NOTE: Allow over score of individual problem
            total_score += parseInt(item.value)
        }
    });
    if (total_score > full_score){
        displayError("We don't allow over-scoring")
        return
    }
    let json = JSON.stringify(data);
    displayError('')

    $.ajax({
        url: `/groupgrader/grader-grade-submit/${assn_id}`,
        type: "POST",
        data: `json=${json}&total_score=${total_score}&csrfmiddlewaretoken=${getCSRFToken()}`,
        dataType : "json",
        success: function(response){
            window.location.replace(`/groupgrader/grader-grade/${response.assn_id}/${from_group_grading}`);
        },
        error: updateError
    });
    
}


/** 
 * ###############################################################################
 * #  HTML helper. 
 * #  Used mainly for dynamically create course page, assignment page, and dynamically create modal form
 * ###############################################################################
 */


// AJAX Action function
// Make course page for both grader and student
function updateAssignmentList(response) {
    // Removes all existing to-do list items
    let list = $(`#id_assignment_list`)
    // Removes all existing to-do list items
    let assignments = response.assignments
    console.log(assignments)
    if (response.identity == 'student') {
        for (let i = 0; i < assignments.length; i++) {
            let currAssignment = assignments[i]
            let currAssignmentID = currAssignment.id
            if ((! $(`#id_assignment_${currAssignmentID}`).length)) {
                list.prepend(makeAssignmentHTMLForStudent(currAssignment))
            }
        }
    }else{
        list.empty()
        for (let i = 0; i < assignments.length; i++) {
            let currAssignment = assignments[i]
            let currAssignmentID = currAssignment.id
            list.prepend(makeAssignmentHTMLForGrader(currAssignment))
        }
    }
}


// AJAX Action function
// Make dashboard html for both grader and student
function updateCourseList(response) {
    // Removes all existing to-do list items
    let courses = response.courses
    courses.forEach(course => {
        if (document.getElementById(`id_course_${course.id}`) == null) {
            $("#id_course_list").append(makeCourseHTML(course))
        }
    })
}


// AJAX Action function
// Make submission list
function updateSubmissionList(response) {
    let submissions = response.submissions
    $("#id_submission_list").empty()
    console.log(response)
    // Modify all entries because the changes in details need to be revealed instantly
    submissions.forEach(submission => {
        $("#id_submission_list").append(makeSubmissionHTML(submission))
    })
}


// AJAX Action function
// Make group submission list
function updateGroupSubmissionList(response) {
    let submissions = response.submissions
    $("#id_submission_list").empty()
    console.log(response)
    // Modify all entries because the changes in details need to be revealed instantly
    submissions.forEach(submission => {
        if (submission.submission_id == "Not submitted yet"){
            let fullSubmissionEntry = document.createElement("div")
            // fullSubmissionEntry.id = `id_submission_`
            fullSubmissionEntry.className = `row`
            let gridStyle1 = `col-sm-3 p-2 text-black text-center`
            let gridStyle2 = `col-sm-9 p-2 text-black text-center`
            let nameGrid = document.createElement("div")
            nameGrid.className = gridStyle1
            nameGrid.innerHTML = `<p1 class="lead"> ${submission.student_id} </p>`
            let gradedGrid = document.createElement("div")
            gradedGrid.className = gridStyle2
            gradedGrid.innerHTML =  `<p1 class="lead"> ${submission.submission_id} </p>`
            fullSubmissionEntry.appendChild(nameGrid)
            fullSubmissionEntry.appendChild(gradedGrid)
            $("#id_submission_list").append(fullSubmissionEntry)
        }else{
            $("#id_submission_list").append(makeGroupSubmissionHTML(submission))
        }
    })
}


// make submission URL for assignment entry
function submissionURLFormatter(submission) {
    let linkText = submission.student_id
    let submissionLink = submissionURL.replace("0", submission.submission_id).replace("9999", "0")
    let submissionLinkURL = `<a href="${submissionLink}"> <p1 class="lead"> ${linkText} </p> </a>`
    return submissionLinkURL
}

function makeAssignmentLinkHTML(assignment) {
    let assignmentLink = assignmentURL.replace("1", assignment.id)
    let assignmentLinkHTML = `<a href="${assignmentLink}"> <p1 class="lead">${assignment.name} </p></a>`
    return assignmentLinkHTML
}

// Make datatime html.
// Future: Need to adjust timezone
function makeDateTimeHMTL(timeStr) {
    let assignmentDateTime = new Date(timeStr)

    // NOTE: Time zone issue very important !!!!!!!!!
    // This fixed time zone issue of due_date, but submit_date issue still remains.
    // It's possible that submit_date issue is from django's timezone or EC2
    let utcDate = new Date(assignmentDateTime.toLocaleString('en-US', { timeZone: "UTC" }));
    let tzDate = new Date(assignmentDateTime.toLocaleString('en-US', { timeZone: "America/New_York" }));
    let offset = utcDate.getTime() - tzDate.getTime();
    assignmentDateTime.setTime( assignmentDateTime.getTime() + offset );

    let formatDate = assignmentDateTime.toLocaleDateString()
    let formatTime = assignmentDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    let formatDateTime = `${formatDate} ${formatTime}`
    return formatDateTime
}

// Make html for grader's assignment page
function makePublishHTML(published) {
    if (published) {
        return `<p1 class="lead"> Published </p>`
    } else {
        return `<p1 class="lead"> Not Published </p>`
    }
}

// Make html for grader's assignment page
function makeGradedHTML(graded) {
    if (graded) {
        return `<p1 class="lead"> Yes </p>`
    } else {
        return `<p1 class="lead"> No </p>`
    }
}

// Make html for dashboard page
function makeCourseHTML(course) {
    let courseLinkHTML = courseURL.replace("0", course.course_num)
    let cardWrapper = document.createElement("div")
    cardWrapper.className = `col-sm-4 mb-2`
    let courseCard = document.createElement("div")
    courseCard.className = "card"
    let courseColor = document.createElement("div")
    courseColor.className = "card-header"
    courseColor.innerHTML = "&nbsp"
    courseColor.setAttribute("style", `background-color:${course.course_color}`)

    let cardBody = document.createElement("div")
    cardBody.className = "card-body"
    let courseTitle = document.createElement("h5")
    courseTitle.className = "card-title"
    courseTitle.innerHTML = `${course.course_num}`
    let courseName = document.createElement("p")
    courseName.className = "card-text"
    courseName.innerHTML = `${course.course_name}`
    let courseLink = document.createElement("a")

    console.log(course.course_color)

    courseLink.className = `btn btn-info`
    courseLink.setAttribute(`href`, `${courseLinkHTML}`)
    courseLink.innerHTML = "View Assignments"

    cardBody.appendChild(courseTitle)
    cardBody.appendChild(courseName)
    cardBody.appendChild(courseLink)
    courseCard.appendChild(courseColor)
    courseCard.appendChild(cardBody)
    cardWrapper.appendChild(courseCard)
    cardWrapper.id = `id_course_${course.id}`
    return cardWrapper
}


// Make html for assignmentSummary page
function makeSubmissionHTML(submission) {
    let gridStyle1 = `col-sm-3 p-2 text-black text-center`
    let gridStyle2 = `col-sm-2 p-2 text-black text-center`
    let submissionTime = makeDateTimeHMTL(submission.submission_time)
    let submissionURLHTML = submissionURLFormatter(submission)
    let gradedHTML = makeGradedHTML(submission.graded)
    let nameGrid = document.createElement("div")

    nameGrid.className = gridStyle1
    nameGrid.innerHTML = submissionURLHTML
    let gradedGrid = document.createElement("div")
    gradedGrid.className = gridStyle1
    gradedGrid.innerHTML = gradedHTML

    let scoreGrid = document.createElement("div")
    scoreGrid.className = gridStyle1
    scoreGrid.innerHTML = `<p1 class="lead"> ${submission.score} </p>`
    let submissionTimeGrid = document.createElement("div")
    submissionTimeGrid.className = gridStyle1
    submissionTimeGrid.innerHTML = `<p1 class="lead"> ${submissionTime} </p>`
    let fullSubmissionEntry = document.createElement("div")
    fullSubmissionEntry.id = `id_submission_${submission.submission_id}`
    fullSubmissionEntry.className = `row`

    fullSubmissionEntry.appendChild(nameGrid)
    fullSubmissionEntry.appendChild(gradedGrid)
    fullSubmissionEntry.appendChild(scoreGrid)
    fullSubmissionEntry.appendChild(submissionTimeGrid)
    return fullSubmissionEntry
}


// Make html for grader's assignment page
function makeAssignmentHTMLForGrader(assignment) {
    let gridStyle1 = `col-sm-3 p-2 text-black text-center`
    let gridStyle2 = `col-sm-2 p-2 text-black text-center`
    let dueDate = makeDateTimeHMTL(assignment.due_date)
    let assignmentURLHTML = makeAssignmentLinkHTML(assignment)
    let published = makePublishHTML(assignment.published)
    let nameGrid = document.createElement("div")
    nameGrid.className = gridStyle1
    nameGrid.innerHTML = assignmentURLHTML
    let dueDateGrid = document.createElement("div")
    dueDateGrid.className = gridStyle1
    dueDateGrid.innerHTML = `<p1 class="lead"> ${dueDate} </p>`
    let submissionCountGrid = document.createElement("div")
    submissionCountGrid.className = gridStyle2

    submissionCountGrid.innerHTML = `<p1 class="lead"> ${assignment.submission_cnt} </p>`
    let gradedPercGrid = document.createElement("div")

    gradedPercGrid.className = gridStyle2
    gradedPercGrid.innerHTML = `<div class="progress">
        <div class="progress-bar" role="progressbar"style="width: ${assignment.graded_perc}%"
        aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        </div>`
    let publishGrid = document.createElement("div")
    publishGrid.className = gridStyle2
    publishGrid.innerHTML = published
    let fullAssignmentEntry = document.createElement("div")
    fullAssignmentEntry.id = `id_assignment_${assignment.id}`
    fullAssignmentEntry.className = `row`

    fullAssignmentEntry.appendChild(nameGrid)
    fullAssignmentEntry.appendChild(dueDateGrid)
    fullAssignmentEntry.appendChild(submissionCountGrid)
    fullAssignmentEntry.appendChild(gradedPercGrid)
    fullAssignmentEntry.appendChild(publishGrid)
    return fullAssignmentEntry
}


// Dynamically make modal form for student's assignment page
// Why this is in javascript?
// Because there are many many modal forms for all assignment entries.
function makeAssignmentModal(assn_id){
    let modal = 
`<div class="modal fade" id="id_outer_${assn_id}" tabindex="-1">
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title" id="questionCountInput">Submit Assignment</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body row g-3">
      
      <div class="col-sm-6 mb-3">
          <button type="button" class="btn btn-light" onclick="downloadPDF(${assn_id})">View Handout</button>
      </div>
      <div class="col-sm-6 mb-3">
          <button type="button" class="btn btn-light" data-bs-target="#id_inner_${assn_id}" data-bs-toggle="modal" data-bs-dismiss="modal">Submit Assignment</button>
      </div>
      <h6 class="font-weight-light">- View handout if your instructor has uploaded it (Or 404).<br>- Submit a single PDF for this assignment. Don't forget to assign pages.</h6>
  </div>
  </div>
</div>
</div>

<div class="modal fade" id="id_inner_${assn_id}" data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true" aria-labelledby="rubricFormCreator" tabindex="-1">
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title" id="rubricFormCreator">Submit Assignment</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <form id="id_submit_assignment_form" class="row g-3">
          <div class="col-sm-12 mb-3">
            <label for="id_assn_file_${assn_id}" class="form-label">Please upload pdf here</label>
            <input class="form-control" type="file" id="id_assn_file_${assn_id}" name="id_assn_file">
          </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="460" class="btn btn-info" data-bs-dismiss="modal" onclick="submitAssignment(${assn_id})">Submit</button>
    </div>
  </div>
</div>
</div>`
    return modal
}


// Make html for student's assignment page
function makeAssignmentHTMLForStudent(assignment) {
    let gridStyle = `col-sm-4 p-2 text-black text-center`
    let dueDate = makeDateTimeHMTL(assignment.due_date)

    let assignmentURLHTML = ""


    if (assignment.is_submitted == true){
        // Click the link will go to preview student's own work 
        assignmentURLHTML = makeAssignmentLinkHTML(assignment)
    }else{
        // modal to download / submit
        let modal = makeAssignmentModal(assignment.id)
        assignmentURLHTML = 
        `<a class="btn btn-border-width=0" data-bs-toggle="modal" 
        href="#id_outer_${assignment.id}" role="button"><p1 class="lead"> ${assignment.name} </p></a>` + modal
    }
    
    let nameGrid = document.createElement("div")
    nameGrid.className = gridStyle
    nameGrid.innerHTML = assignmentURLHTML
    let statusGrid = document.createElement("div")

    statusGrid.className = gridStyle
    statusGrid.innerHTML = `<p1 class="lead" id=id_status_${assignment.id}"> ${assignment.status} </p>`

    let dueDateGrid = document.createElement("div")
    dueDateGrid.className = gridStyle
    if (assignment.is_submitted == true){
        dueDateGrid.innerHTML = `<p1 class="lead"> Submitted at ${dueDate} </p>`
    }else{
        dueDateGrid.innerHTML = `<p1 class="lead"> ${dueDate} </p>`
    }

    let fullAssignmentEntry = document.createElement("div")
    fullAssignmentEntry.id = `id_assignment_${assignment.id}`
    fullAssignmentEntry.className = `row`
    fullAssignmentEntry.appendChild(nameGrid)
    fullAssignmentEntry.appendChild(statusGrid)
    fullAssignmentEntry.appendChild(dueDateGrid)
    return fullAssignmentEntry
}


// Make html for grader's create assignment
function generateRubricEntry(id) {
    const col_format = `col-sm-4 nopadding form-floating`
    let entry = document.createElement("div")
    entry.id = `id_q${id}`
    entry.className = "row mb-2"
    entry.setAttribute("data-id", `${id}`)
    let question_num = document.createElement("div")
    question_num.className = col_format
    question_num.innerHTML=`<div class="form-group"> <input type="text" step="1" min_value="0" class="form-control" id="id_input_question_num_${id}" name="id_input_question_num_#${id}" value="" placeholder="Big question number"></div>`
    let total_score = document.createElement("div")
    total_score.className = col_format
    total_score.innerHTML=`<div class="form-group"> <input type="number" step="0.01" min_value="0" class="form-control" id="id_input_total_score_${id}" name="id_input_total_score_#${id}" value="" placeholder="Full score of this question"></div>`
    let description = document.createElement("div")
    description.className = col_format
    description.innerHTML=`<div class="form-group"> <textarea type="text" class="form-control" id="id_input_description_${id}" name="id_input_description_#${id}" value="" placeholder="Description of this question">`
    let subquestion_outer_wrapper = document.createElement("div")
    subquestion_outer_wrapper.className = col_format
    let subquestion_cnt_selector = document.createElement("select")
    subquestion_cnt_selector.id = `id_input_subq_cnt_${id}`
    subquestion_cnt_selector.className = `form-control`
    subquestion_cnt_selector.setAttribute("name",`subquestionCnt${id}`)
    // Not used.
    // For generating sub problems
    for (let i = 0; i < 10; i ++) {
        var option = document.createElement("option")
        option.setAttribute("value", `${i}`)
        option.innerHTML = `${i}`
        subquestion_cnt_selector.appendChild(option)
    }
    let subquestion_inner_wrapper = document.createElement("div")
    subquestion_inner_wrapper.className = `input-group`
    let subquestion_add_btn= document.createElement("div")
    subquestion_add_btn.className = `input-group-btn`
    subquestion_add_btn.innerHTML=`<button class="btn btn-success" type="button" onclick="insertSubquestion(${id});"> Add level </button>`
    subquestion_inner_wrapper.appendChild(subquestion_cnt_selector)
    subquestion_inner_wrapper.appendChild(subquestion_add_btn)
    subquestion_outer_wrapper.appendChild(subquestion_inner_wrapper)
    entry.appendChild(question_num)
    entry.appendChild(total_score)
    entry.appendChild(description)
    return entry
}


// make rubric form when creating assignment
function createRubricForm() {
    console.log("here")
    var cnt = $("#id_input_big_question_num").val()
    $("#id_insert_rubric_form").html("")
    for (let i = 0; i < cnt; i++) {
        var entry_id = i + 1
        $("#id_insert_rubric_form").append(generateRubricEntry(entry_id))
    }
}

// helper for insertSubquestion
// Not used eventually
// Future: extend to subquestions
function insertSubquestion(prev_id) {
    let subq_cnt = $(`#id_input_subq_cnt_${prev_id}`).val()
    for (let k = 0; k < subq_cnt; k ++) {
        insertSubquestionHelper(prev_id, k+1)
    }
}


// helper for insertSubquestion
// Not used eventually
// Future: extend to subquestions
function insertSubquestionHelper(prev_id, seq) {
    let sub_id = prev_id * 10 + seq
    const col_format = `col-sm-3 nopadding`
    var subdiv = document.createElement("div")
	subdiv.setAttribute("class", "form-group removeclass"+sub_id)
    subdiv.id = (`id_q${sub_id}`)
    let entry = document.createElement("div")
    entry.className = "row mb-2"
    let question_num = document.createElement("div")
    question_num.className = `col-sm-2 offset-sm-1`
    question_num.innerHTML=`<div class="form-group"> <input type="text" step="1" min_value="0" class="form-control" name="id_input_question_num_#${sub_id}" id="id_input_question_num_#${sub_id}" value="" placeholder="Subquestion number"></div>`
    let total_score = document.createElement("div")
    total_score.className = col_format
    total_score.innerHTML=`<div class="form-group"> <input type="number" step="0.01" min_value="0" class="form-control" name="id_input_total_score_#${sub_id}" id="id_input_total_score_#${sub_id}" placeholder="Full score of this question"></div>`
    let description = document.createElement("div")
    description.className = col_format
    description.innerHTML=`<div class="form-group"> <input type="text" class="form-control" name="id_input_description_${sub_id}" id="id_input_description_${sub_id}" placeholder="Description of this question"></div>`
    let subquestion_outer_wrapper = document.createElement("div")
    subquestion_outer_wrapper.className = `col-sm-3 nopadding`
    let subquestion_cnt_selector = document.createElement("select")
    subquestion_cnt_selector.id = `id_input_subq_cnt_${sub_id}`
    subquestion_cnt_selector.className = `form-control`
    subquestion_cnt_selector.setAttribute("name",`subquestionCnt${sub_id}`)
    for (let i = 0; i < 10; i ++) {
        var option = document.createElement("option")
        option.setAttribute("value", `${i}`)
        option.innerHTML = `${i}`
        subquestion_cnt_selector.appendChild(option)
    }
    let subquestion_inner_wrapper = document.createElement("div")
    subquestion_inner_wrapper.className = `input-group`
    let subquestion_add_btn= document.createElement("div")
    subquestion_add_btn.className = `input-group-btn`
    subquestion_add_btn.innerHTML=`<button class="btn btn-success" type="button" onclick="insertSubquestion(${sub_id})"> Add level </button>`
    let subquestion_del_btn = document.createElement("div")
    subquestion_del_btn.className = `input-group-btn`
    subquestion_del_btn.innerHTML = `<button class="btn btn-danger" type="button" onclick="removeSubquestion(${sub_id});"> x </button>`
    subquestion_inner_wrapper.appendChild(subquestion_cnt_selector)
    subquestion_inner_wrapper.appendChild(subquestion_add_btn)
    subquestion_inner_wrapper.appendChild(subquestion_del_btn)
    subquestion_outer_wrapper.appendChild(subquestion_inner_wrapper)
    entry.appendChild(question_num)
    entry.appendChild(total_score)
    entry.appendChild(description)
    entry.appendChild(subquestion_outer_wrapper)
    subdiv.appendChild(entry)
    $(`#id_q${prev_id}`).append(subdiv)    
    // entry.style.backgroundColor = `lightgrey`
}
    

// helper for insertSubquestion
// Not used eventually
// Future: extend to subquestions
function removeSubquestion(rid) {
	$(`#id_q${rid}`).remove();
}

// make submission URL for group assignment entry
function groupedSubmissionURLFormatter(submission) {
    let linkText = submission.student_id
    let submissionLink = submissionURL.replace("0", submission.submission_id).replace("9999", "1")
    let submissionLinkURL = `<a href="${submissionLink}"> <p1 class="lead"> ${linkText} </p> </a>`
    return submissionLinkURL
}


// make group submission html
function makeGroupSubmissionHTML(submission) {
    let gridStyle1 = `col-sm-3 p-2 text-black text-center`
    let gridStyle2 = `col-sm-2 p-2 text-black text-center`
    let submissionTime = makeDateTimeHMTL(submission.submission_time)
    let submissionURLHTML = groupedSubmissionURLFormatter(submission)
    let gradedHTML = makeGradedHTML(submission.graded)
    let nameGrid = document.createElement("div")
    nameGrid.className = gridStyle1
    nameGrid.innerHTML = submissionURLHTML
    let gradedGrid = document.createElement("div")
    gradedGrid.className = gridStyle1
    gradedGrid.innerHTML = gradedHTML
    let scoreGrid = document.createElement("div")
    scoreGrid.className = gridStyle1
    scoreGrid.innerHTML = `<p1 class="lead"> ${submission.score} </p>`
    let submissionTimeGrid = document.createElement("div")
    submissionTimeGrid.className = gridStyle1
    submissionTimeGrid.innerHTML = `<p1 class="lead"> ${submissionTime} </p>`
    let fullSubmissionEntry = document.createElement("div")
    fullSubmissionEntry.id = `id_submission_${submission.submission_id}`
    fullSubmissionEntry.className = `row`
    fullSubmissionEntry.appendChild(nameGrid)
    fullSubmissionEntry.appendChild(gradedGrid)
    fullSubmissionEntry.appendChild(scoreGrid)
    fullSubmissionEntry.appendChild(submissionTimeGrid)
    return fullSubmissionEntry
}

// Dynamically make grading form on assignmentGrading page
function makeGradingFormHelper(rubric, pages, qid) {
    console.log(rubric)
    let entryStyle = "row mb-2"
    let gridStyle = "col-md-5"
    let originalInfo = document.createElement("div")
    originalInfo.className = "row justify-content-around"
    let gradedInfo = document.createElement("div")
    gradedInfo.className = "row justify-content-around"
    let gradingEntry = document.createElement("div")
    gradingEntry.id = `id_graded_question_${qid}`
    gradingEntry.className = entryStyle
    gradingEntry.setAttribute("data-id", "1")
    gradingEntry.setAttribute("name", `id_graded_question_${qid}`)
    let showQuestionName = document.createElement("a")
    let fetchedQuestionName = rubric[`id_input_question_num_#${qid}`]
    console.log(rubric)
    console.log(fetchedQuestionName)
    showQuestionName.innerHTML = `<p1 class='lead' >Grading Question: ${fetchedQuestionName}</p>` 
    // showQuestionName.className = gridStyle
    let page_num = pages[`Q${qid}start`]
    showQuestionName.onclick = function(){
        changeCurrentPage(parseInt(page_num))
    }
    showQuestionName.href = "#"
    showQuestionName.className = "row"
    let showScore = document.createElement("div")
    let fetchedScore = rubric[`id_input_total_score_#${qid}`]
    showScore.innerHTML = `<p1 class='lead' style="font-size:18px;">Full mark: ${fetchedScore}</p>` 
    showScore.className = gridStyle

    let showDescription = document.createElement("div")
    let fetchedDescription = rubric[`id_input_description_#${qid}`]
    showDescription.innerHTML = `<p1 class='lead' style="font-size:18px;">Description: ${fetchedDescription}</p>`
    showDescription.className = gridStyle
    let inputScoreBox = document.createElement("input")
    inputScoreBox.id = `id_input_real_score_#${qid}`
    inputScoreBox.setAttribute("type", "number")
    inputScoreBox.setAttribute("step", "0.01")
    inputScoreBox.setAttribute("name", `id_input_real_score_#${qid}`)
    inputScoreBox.setAttribute("max", fetchedScore)
    inputScoreBox.setAttribute("min", 0)
    inputScoreBox.setAttribute("oninput", "checkValue(this)")
    inputScoreBox.setAttribute("placeholder", "Input score here")
    inputScoreBox.className = gridStyle
    let inputCommentBox = document.createElement("input")
    inputCommentBox.id = `id_graded_comment_${qid}`
    // inputCommentBox.setAttrbute("type", "texarea")
    inputCommentBox.className = gridStyle
    inputCommentBox.setAttribute("placeholder", "Comment here")
    inputCommentBox.setAttribute("name", `id_graded_comment_${qid}`)
    originalInfo.appendChild(showScore)
    originalInfo.appendChild(showDescription)
    gradedInfo.appendChild(inputScoreBox)
    gradedInfo.appendChild(inputCommentBox)
    gradingEntry.appendChild(showQuestionName)
    gradingEntry.appendChild(originalInfo)
    gradingEntry.appendChild(gradedInfo)
    return gradingEntry
}

// Dynamically make score breakdown modal form on student's assignment page (graded)
function makeScoreBreakDownHelper(rubric, pages, qid) {
    let entryStyle = "row mb-2"
    let gradingEntry = document.createElement("div")
    gradingEntry.id = `id_graded_question_${qid}`
    gradingEntry.className = entryStyle
    gradingEntry.setAttribute("data-id", "1")

    let showName = document.createElement("a")
    let fetchedName = rubric[`id_input_question_num_#${qid}`]
    showName.innerHTML = `<p1 class='lead'>${fetchedName}</p>` 
    let page_num = pages[`Q${qid}start`]
    showName.onclick = function(){
        changeCurrentPage(parseInt(page_num))
    }
    showName.href = "#"

    let showScore = document.createElement("div")
    let fetchedScore = rubric[`id_input_total_score_#${qid}`]
    let fetchedRealScore = rubric[`id_input_real_score_#${qid}`]
    showScore.innerHTML = "Subscore: " + fetchedScore + " / " + fetchedRealScore

    let showDescription = document.createElement("div")
    let fetchedDescription = rubric[`id_input_description_#${qid}`]
    showDescription.innerHTML = "Description: " + fetchedDescription

    let showComment = document.createElement("div")
    let fetchedComment = rubric[`id_graded_comment_${qid}`]
    showComment.innerHTML = "Comments: " + fetchedComment

    gradingEntry.appendChild(showName)
    gradingEntry.appendChild(showDescription)
    gradingEntry.appendChild(showScore)
    gradingEntry.appendChild(showComment)
    return gradingEntry
}

/** 
 * ###############################################################################
 * #  End HTML maker. 
 * ###############################################################################
 */
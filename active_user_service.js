const fs = require('fs')
const coursesByDepartment = JSON.parse(fs.readFileSync('Courses_by_department.json', 'utf8'))
const coursesForMatch = JSON.parse(fs.readFileSync('Courses.json'))
const express = require('express')
const app = express()
const port = 3000

String.prototype.replaceAll = function(search, replacement) {
    let target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
}

/**
 * Two usages for this route:
 *      /courses?search="queryString" - This returns a list of matching course strings,
 *                                      I currently use toUpperCase and match any location in the string
 *      /courses - This returns a json object where the department is the key
 *                 and the value is a list of json objects with course_name and common_name key/value pairs
 */
app.get('/courses', (req, res) => {
    queryString = req.query.search.replaceAll('"', '').trim().toUpperCase()
    if (queryString != null) {
        res.send(coursesForMatch.filter(course => course.toUpperCase().includes(queryString)))
    } else {
        res.send(coursesByDepartment)
    }
})

/**
 * This route requires the header StudentToken, returns a list of courses pertaining to the student
 * NOTE: This is currently only going to give back a hard coded list of courses until we have LDAP access
 */
app.get('/classes', (req, res) => {
    if (req.get('StudentToken') == null) {
        res.status(400)
        res.send('StudentToken not provided')
    } else {
        res.send(['MA211 (Differential Equations)', 'MA212 (Matrix Algebra & Systems of Differential Equations)',
           'MA223 (Engineering Statistics I)', 'MA275 (Discrete & Combinatorial Algebra I)'])
    }
})

app.listen(port, () => console.log(`Active User Service listening on port ${port}!`))
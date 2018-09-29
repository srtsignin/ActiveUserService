import os
import json
input_path = "Courses.json"
output_path_1 = "Courses_by_department.json"
script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
input_file_path = os.path.join(script_dir, input_path)
output_file_path_1 = os.path.join(script_dir, output_path_1)

by_department_list = {}

count = 0
with open(input_file_path, 'r') as f:
    master = json.load(f)
    for course in master:
        count = count + 1
        if course['department'] in by_department_list:
            by_department_list[course['department']].append(course)
        else:
            by_department_list[course['department']] = []
            by_department_list[course['department']].append(course)

with open(output_file_path_1, 'w') as f:
    json.dump(by_department_list, f)

print("Finished processing ", count, " courses")
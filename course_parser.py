import os
import json
input_path = "OldCourses.json"
# output_path_1 = "Courses_by_department.json"
output_path_2 = "Courses.json"
script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
input_file_path = os.path.join(script_dir, input_path)
# output_file_path_1 = os.path.join(script_dir, output_path_1)
output_file_path_2 = os.path.join(script_dir, output_path_2)

# drop_down_json = {}
# string_search_json = []

# count = 0
# with open(input_file_path, 'r') as f:
#     for line in f:
#         if count == 0:
#             count = count + 1
#             continue
#         line = line.rstrip('\n').split(',')
#         department = line[1]
#         course_name = line[2]
#         common_name = line[3]
#         if department not in drop_down_json.keys():
#             drop_down_json[department] = []
#         drop_down_json[department].append({"course_name":course_name, "common_name":common_name})
#         string_search_json.append({"course_name":course_name, "common_name":common_name})
#         count = count + 1

# with open(output_file_path_1, 'w') as f:
#     json.dump(drop_down_json, f)

new_courses = []

with open(input_file_path, 'r') as f:
    courses = json.load(f)
    for course in courses:
        new_courses.append({'name':course.get('name', ''),
            'number': course.get('number', ''),
            'department': course.get('department', ''),
            'queryString': course.get('department', '') + str(course.get('number', '')) + ' ' + course.get('name', '')})

with open(output_file_path_2, 'w') as f:
    json.dump(new_courses, f)

print("Finished processing courses")
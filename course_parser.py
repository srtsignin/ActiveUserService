import os
import json
input_path = "LCCourses.csv"
output_path = "Courses.json"
script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
input_file_path = os.path.join(script_dir, input_path)
output_file_path = os.path.join(script_dir, output_path)

json_dict = {}

count = 0
with open(input_file_path, 'r') as f:
    for line in f:
        if count == 0:
            count = count + 1
            continue
        line = line.rstrip('\n').split(',')
        department = line[1]
        course_name = line[2]
        common_name = line[3]
        if department not in json_dict.keys():
            json_dict[department] = []
        json_dict[department].append({"course_name":course_name, "common_name":common_name})
        count = count + 1
with open(output_file_path, 'w') as f:
    json.dump(json_dict, f)

print("Finished processing", count, "courses")
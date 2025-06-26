# This file runs program.py for every .txt file in warmup-anylang-files directory
# example: python3 program.py ./warmup-anylang-files/warmup-simple.txt

import os
import subprocess

# Define the directory containing .txt files
DIRECTORY = "./warmup-anylang-files"

# Get a list of all .txt files in the specified directory
txt_files = [f for f in os.listdir(DIRECTORY) if f.endswith('.txt')]

# Loop through each .txt file and run program.py with it as an argument
for txt_file in txt_files:
    file_path = os.path.join(DIRECTORY, txt_file)
    command = ["python3", "program.py", file_path]
    subprocess.run(command)

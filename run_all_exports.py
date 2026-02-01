import subprocess
import sys
import os

# Ensure the project root is on the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

scripts_to_run = [
    # Level 0
    "services/tables/HR_Core/absence_table.py",
    "services/tables/HR_Core/career_table.py",
    "services/tables/HR_Core/corporation_branch_table.py",
    "services/tables/HR_Core/department_table.py",
    "services/tables/HR_Core/job_table.py",
    "services/tables/HR_Core/position_table.py",
    "services/tables/HR_Core/project_table.py",
    "services/tables/HR_Core/region_table.py",
    "services/tables/HR_Core/school_table.py",
    "services/tables/Payroll/payroll_item_table.py",
    "services/tables/Performance/evaluation_system_table.py",
    "services/tables/Time_Attendance/leave_type_table.py",
    "services/tables/Time_Attendance/working_system_table.py",

    # Level 1
    "services/tables/Time_Attendance/working_type_table.py",
    "services/tables/HR_Core/basic_info_table.py",

    # Level 2
    "services/tables/Performance/evaluation_apply_table.py",
    
    # After basic_info is created, we need department_info
    "services/tables/HR_Core/department_info_table.py",

    # Now run scripts that depend on basic_info and other L0 tables
    "services/tables/HR_Core/absence_info_table.py",
    "services/tables/HR_Core/school_info_table.py",
    "services/tables/HR_Core/contract_info_table.py",
    "services/tables/HR_Core/corp_branch_info_table.py",
    "services/tables/HR_Core/pjt_info_table.py",
    "services/tables/Time_Attendance/working_info_table.py",
    "services/tables/HR_Core/position_info_table.py",
    "services/tables/HR_Core/job_info_table.py",
    
    # These have more complex dependencies
    "services/tables/HR_Core/career_info_table.py",
    "services/tables/HR_Core/salary_contract_info_table.py",
    "services/tables/HR_Core/region_info_table.py",

    # Time_Attendance dependencies
    "services/tables/Time_Attendance/detailed_working_info_table.py",
    "services/tables/Time_Attendance/daily_working_info_table.py",
    "services/tables/Time_Attendance/detailed_leave_info_table.py",

    # Performance dependencies
    "services/tables/Performance/evaluation_original_score_info_table.py",
    "services/tables/Performance/evaluation_modified_score_info_table.py",

    # Payroll dependencies
    "services/tables/Payroll/detailed_monthly_payroll_info_table.py",
    "services/tables/Payroll/yearly_payroll_info_table.py"
]

env = os.environ.copy()
env['PYTHONPATH'] = project_root

for script in scripts_to_run:
    print(f"Running {script}...")
    try:
        result = subprocess.run([sys.executable, script], check=True, capture_output=True, text=True, encoding='utf-8', env=env)
        print(result.stdout)
        if result.stderr:
            print("Stderr:")
            print(result.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error running {script}:")
        print(e.stdout)
        print(e.stderr)
        break 
    except FileNotFoundError:
        print(f"Error: Script not found at {script}")
        break

print("All scripts executed.")

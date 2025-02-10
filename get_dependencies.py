import os
import ast
import sys
import pkgutil

def get_imports_from_file(file_path):
    """Extract import statements from a Python file."""
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)
    
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split(".")[0])
    
    return imports

def get_all_python_files(folder):
    """Recursively get all Python files in a directory."""
    python_files = []
    for root, _, files in os.walk(folder):
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))
    return python_files

def filter_builtin_modules(modules):
    """Filter out built-in Python modules."""
    std_libs = {mod for _, mod, _ in pkgutil.iter_modules()}
    return sorted(modules - std_libs)

def list_dependencies(folder):
    """Find all unique dependencies in a folder of Python files."""
    all_files = get_all_python_files(folder)
    all_imports = set()

    for file in all_files:
        all_imports.update(get_imports_from_file(file))

    dependencies = filter_builtin_modules(all_imports)
    return dependencies

# Change `your_folder_path` to the directory containing your Python files
folder_path = "backend_py"
dependencies = list_dependencies(folder_path)

print("Dependencies found:")
print("\n".join(dependencies))

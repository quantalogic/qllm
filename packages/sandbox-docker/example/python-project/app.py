import os

input_value = os.environ.get('INPUT_VALUE', 'default')
result = f"Processed input: {input_value.upper()}"

os.makedirs('/app/output', exist_ok=True)
with open('/app/output/output.txt', 'w') as f:
    f.write(result)

print(result)
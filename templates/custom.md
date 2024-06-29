# {{ project_name }}

{{ project_description }}

{% for file in files %}
## {{ file.path }}

{{ file_purpose }}

```{{ file.language }}
{{ file.content }}
```

{% endfor %}

## Next Steps:
{{ next_steps }}

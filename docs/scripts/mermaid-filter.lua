#!/usr/bin/env lua

-- Configuration
local config = {
  output_format = "png",  -- SVG for highest quality
  width = 3840,           -- 4K width
  height = 2160,          -- 4K height
  scale = 4,              -- Increased scale factor
  background = "transparent",
  theme = "default",
  tmp_dir = os.getenv("TEMP") or "/tmp",
  mermaid_cli = "mmdc"
}

-- Helper functions
local function file_exists(name)
  local f = io.open(name, "r")
  if f ~= nil then io.close(f) return true else return false end
end

local function ensure_directory(path)
  os.execute("mkdir -p " .. path)
end

local function cleanup_file(file)
  if file_exists(file) then
      os.remove(file)
  end
end

local function execute_command(command)
  local handle = io.popen(command .. " 2>&1")
  local result = handle:read("*a")
  local success, _, code = handle:close()
  return success, code, result
end

-- Main mermaid function
local function mermaid(elem)
  if elem.classes[1] ~= "mermaid" then return nil end

  ensure_directory(config.tmp_dir)
  local input_file = config.tmp_dir .. "/" .. pandoc.sha1(elem.text) .. ".mmd"
  local output_file = config.tmp_dir .. "/" .. pandoc.sha1(elem.text) .. "." .. config.output_format

  -- Write mermaid content to input file
  local f = io.open(input_file, "w")
  if not f then
      io.stderr:write("Error: Unable to create temporary input file\n")
      return nil
  end
  f:write(elem.text)
  f:close()

  -- Construct and execute mermaid command
  local command = string.format(
      "%s -i %s -o %s -w %d -H %d -s %d -b %s -t %s",
      config.mermaid_cli, input_file, output_file,
      config.width, config.height, config.scale, config.background, config.theme
  )

  local success, code, result = execute_command(command)

  -- Clean up input file
  cleanup_file(input_file)

  if not success then
      io.stderr:write("Error executing Mermaid CLI: " .. result .. "\n")
      return nil
  end

  if not file_exists(output_file) then
      io.stderr:write("Error: Mermaid CLI did not produce output file\n")
      return nil
  end

  -- Return the image
  return pandoc.Image({pandoc.Str("Mermaid diagram")}, output_file)
end

-- Return the filter
return {
  {CodeBlock = mermaid}
}
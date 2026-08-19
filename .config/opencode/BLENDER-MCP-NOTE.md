# Blender MCP — Known Issue & Fix

Applies to the `blender` MCP entry in `opencode.json` (lines 92–106):

```json
"blender": {
    "command": "uv",
    "enabled": false,
    "args": [
        "--directory",
        "$HOME/src/blender_mcp/mcp",
        "run",
        "blender-mcp",
        "--transport",
        "http",
        "--port",
        "9998"
    ]
}
```

Project root: `C:\Users\finn\src\blender_mcp\mcp` (`pyproject.toml`, `blmcp/` package).

## Symptom

Starting the server (via opencode, or directly with
`uv run blender-mcp --transport http --port 9998` from inside `mcp/`)
crashes immediately with:

```
ModuleNotFoundError: No module named 'mcp.server.fastmcp'
```

The crash happens at `mcp/blmcp/__init__.py:22`, before any networking starts:

```python
from mcp.server.fastmcp import FastMCP  # pylint: disable=...
```

## Root cause

`mcp/pyproject.toml:12` declared the dependency as
`mcp[cli]>=1.2.0` — an open upper bound. uv resolved it to
`mcp 2.0.0` (released 2026-07-28, locked in `uv.lock:377`), a
backwards-incompatible major bump.

The code was written against the **mcp 1.x** API, where
`mcp.server.fastmcp.FastMCP` exists. In mcp 2.0.0 that module was
removed; `mcp/server/` now contains `apps.py`, `mcpserver/`,
`lowlevel/`, and exposes `MCPServer` (not `FastMCP`). Walking the
installed package confirms there is **no** `fastmcp` module anywhere
in mcp 2.0.0.

So this is a dependency-resolution / API-drift issue, not a
transport/port/config issue.

## Fix applied (2026-08-19)

Pinned to the 1.x line in `mcp/pyproject.toml:12`:

```diff
-    "mcp[cli]>=1.2.0",
+    "mcp[cli]>=1.2.0,<2",
```

Then `uv sync` (run from inside `mcp/`). Result:

```
- mcp==2.0.0
+ mcp==1.29.0
```

Verified the server now starts cleanly:

```
INFO: Uvicorn running on http://127.0.0.1:9998 (Press CTRL+C to quit)
```

A harmless `IncompleteFieldDefinitionWarning` about a `lifespan`
forward reference (from pydantic-settings) is emitted on startup and
can be ignored.

## Forward-looking note

This pin is a stopgap. To upgrade past mcp 1.x, `blmcp/__init__.py`
(and likely other call sites) must be ported to the mcp 2.0.0 API —
the `FastMCP` class plus the `mcp.settings` /
`mcp.streamable_http_app` flow at lines 60–105 no longer exists in
that shape. Until then, keep the `<2` upper bound.

## Re-enabling in opencode

After confirming the server runs, flip `enabled` to `true` in
`opencode.json` (line 95) to let opencode launch it.

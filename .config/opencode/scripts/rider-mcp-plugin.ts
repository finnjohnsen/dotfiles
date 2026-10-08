import fs from "node:fs"
import path from "node:path"

export default async () => {
  return {
    config(cfg: any) {
      try {
        if (process.platform !== "win32") return
        const localAppData = process.env.LOCALAPPDATA
        const appData = process.env.APPDATA
        if (!localAppData || !appData) return

        const riderHome = path.join(localAppData, "Programs", "Rider")
        const java = path.join(riderHome, "jbr", "bin", "java.exe")
        if (!fs.existsSync(java)) return

        let dirs: string[] = []
        try {
          dirs = fs.readdirSync(path.join(appData, "JetBrains"))
        } catch {
          return
        }

        let port: string | undefined
        let newest = 0
        for (const dir of dirs) {
          if (!dir.startsWith("Rider")) continue
          const file = path.join(appData, "JetBrains", dir, "options", "path.macros.xml")
          try {
            const mtime = fs.statSync(file).mtimeMs
            if (mtime <= newest) continue
            const match = fs
              .readFileSync(file, "utf8")
              .match(/<macro\s+name="RESHARPER_MCP_PORT"\s+value="(\d+)"/)
            if (match) {
              newest = mtime
              port = match[1]
            }
          } catch {}
        }
        if (!port) return

        cfg.mcp = cfg.mcp ?? {}
        cfg.mcp.Rider = {
          type: "local",
          enabled: true,
          command: [
            java,
            "-cp",
            path.join(riderHome, "plugins", "mcpserver", "lib", "*") +
              ";" +
              path.join(riderHome, "lib", "*"),
            "com.intellij.mcpserver.stdio.McpStdioRunnerKt",
          ],
          environment: {
            IJ_MCP_SERVER_PORT: port,
          },
        }
      } catch {}
    },
  }
}

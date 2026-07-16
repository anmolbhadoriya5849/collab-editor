import { WebContainer } from '@webcontainer/api';
import * as Y from "yjs";
import { getTerminal } from './terminal';

export let webcontainerInstance: WebContainer; 
let bootPromise: Promise<WebContainer> | null = null; // Tracks the boot progress

export async function bootOS() {
  // If it's already booting, don't trigger it again. Just wait for the existing promise.
  if (!bootPromise) {
    bootPromise = WebContainer.boot();
  }
  
  try {
    webcontainerInstance = await bootPromise;
    console.log("Node.js OS successfully initialized in the browser session.");
    return webcontainerInstance;
  } catch (error) {
    console.error("Critical failure booting WebContainer:", error);
    throw error;
  }
}

export async function fileSystem(fileContents: Y.Map<Y.Text>) {
  const fileTree: any = {};

  for (const [keys, value] of fileContents.entries()) {
    const fileName = keys.split("/").filter(Boolean);
    const length = fileName.length;
    let current = fileTree;

    fileName.forEach((part, index) => {
      if (index === length - 1) {
        let content = value.toString();
        
        if (part === "package.json") {
          try {
            if (!content.trim()) content = "{}";
            JSON.parse(content);
          } catch (error) {
            console.warn(`Invalid JSON formatting inside package.json context: ${error}`);
            content = "{}";
          }
        }

        current[part] = {
          file: {
            contents: content,
          }
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {}
          };
        }
        current = current[part].directory;
      }
    });
  }

  return fileTree;
}

export async function startDevServer(YjsMap: Y.Map<Y.Text>, fullText: string) {
  // Check 1: If it's not booted yet, forcefully await it before continuing.
  if (!webcontainerInstance) {
    getTerminal().write("\r\n\x1b[1;33mBooting Sandbox Environment... Please wait.\x1b[37m\r\n");
    await bootOS();
  }

  if (!YjsMap) {
    getTerminal().write("\r\n\x1b[1;31mError: No files found to execute.\x1b[37m\r\n");
    return;
  }

  const fileTree = await fileSystem(YjsMap);
  await webcontainerInstance.mount(fileTree);   

  const command = fullText.trim().split(/\s+/);
  const cmd = command[0];
  const args = command.slice(1);

  try {
    const utilsProcess = await webcontainerInstance.spawn(cmd, args);

    utilsProcess.output.pipeTo(new WritableStream({
      write(data) {
        getTerminal().write(data);
      }
    }));

    const exitCode = await utilsProcess.exit;
    getTerminal().write(`\r\n\x1b[1;30mProcess finished with exit code: ${exitCode}\x1b[37m\r\n@webcontainer $ `);
  } catch (error) {
    console.error("Failed executing spawned processes:", error);
    getTerminal().write(`\r\n\x1b[1;31mExecution failure: ${error}\x1b[37m\r\n@webcontainer $ `);
  }
}
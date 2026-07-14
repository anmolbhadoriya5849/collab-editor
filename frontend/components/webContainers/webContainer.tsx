import { WebContainer } from '@webcontainer/api';
import * as Y from "yjs";

export let webcontainerInstance: WebContainer; 

async function bootOS() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
    console.log("Node.js OS is successfully running in the browser!");
  }
}

async function fileSystem(fileContents: Y.Map<Y.Text>) {
    const fileTree : any = {};

    for(const [keys, value] of fileContents.entries()){
        const fileName = keys.split("/").filter(Boolean);
        const length = fileName.length;
        let current = fileTree;

        fileName.forEach((part, index) => {
            if(index === length - 1){
                let content = value.toString();
                
                // Node.js crashes if package.json is completely empty.
                // This forces it to be valid JSON if it's blank.
                if (part === "package.json") {
                    try {
                        JSON.parse(content);
                    } catch (error) {

                        console.warn(`Invalid JSON in package.json. Replacing with default content. Error: ${error}`);
                        content = "{}";
                    }
                }

                current[part] = {
                    file: {
                        contents: content,
                    }
                }
            } else {
                if(!current[part]){
                    current[part] = {
                        directory: {}
                    }
                }
                current = current[part].directory;
            }
        });
    }

    return fileTree;
}

async function startDevServer(YjsMap : Y.Map<Y.Text>) {
  if (!webcontainerInstance) {
    console.error("WebContainer has not finished booting up yet!");
    return;
  }

  if (!YjsMap) {
    console.error("No Yjs files found to mount.");
    return;
  }

  const fileTree = await fileSystem(YjsMap);

  if (!fileTree) {
    console.error("Failed to create file system structure.");
    return;
  }

  // Mount the safely formatted files
  await webcontainerInstance.mount(fileTree);   

  console.log("Executing node utils.js...");

  try {
    // Run the file
    const utilsProcess = await webcontainerInstance.spawn('node', ['utils.js']);

    // Pipe the output to the browser console
    utilsProcess.output.pipeTo(new WritableStream({
      write(data) {
          console.log("[WebContainer]:", data);
      }
    }));

    const exitCode = await utilsProcess.exit;
    console.log(`Script finished with exit code: ${exitCode}`);
  } catch (error) {
    console.error("Failed to run file:", error);
  }
}

export { bootOS, fileSystem, startDevServer };
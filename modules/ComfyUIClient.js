//merci beaucoup à https://github.com/itsKaynine/comfy-ui-client

export class ComfyUIClient {
  serverAddress;
  clientId;
  ws;
  fetchOpt;
  prompt;
  constructor(serverAddress, clientId) {
    this.serverAddress = serverAddress;
    this.clientId = clientId;
    this.fetchOpt ={
      mode: "no-cors", // no-cors, *cors, same-origin
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':'*'        
      }      
    };
  }
  /*
  Connect to the Comfy server to get message and run action
  */
  connect(fctStart,fctProgress,fctExecuted) {
    return new Promise(async (resolve) => {
      if (this.ws) {
        await this.disconnect();
      }
      const url = `ws://${this.serverAddress}/ws?clientId=${this.clientId}`;
      console.log(`Connecting to url: ${url}`);
      this.ws =new WebSocket(url);
      //create event listener for Comfy server
      this.ws.addEventListener("open", (event) => {
        console.log("Connection open");
        resolve();
      });
      this.ws.addEventListener("close", () => {
        console.log("Connection closed");
      });
      this.ws.addEventListener("error", (err) => {
        logger.error({ err }, "WebSockets error");
      });
      this.ws.addEventListener("message", (event, isBinary) => {
        if (isBinary) {
          console.log("Received binary data");
        } else {
          console.log("Received data: ", event.data);
          //management of actions following socket messages
          let json = JSON.parse(event.data);
          if(json.type=='progress' && fctProgress){
            fctProgress(json.data);
          }          
          if(json.type=='execution_start' && json.data.prompt_id){
            fctStart(json.data.prompt_id);
          }
          if(json.type=='executed' && json.data.output){
            fctExecuted(json.data.output);
          }
        }
      });
    });
  }
  
  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = void 0;
    }
  }

  /*
  WARNING: the prompt is launched but it is retrieved from the web socket messages
  */
  async queuePrompt(prompt) {
    this.prompt=prompt;
    const res = await fetch(`http://${this.serverAddress}/prompt`, {
      method: "POST",
      mode: "no-cors",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        client_id: this.clientId
      })
    });
    const json = await res.text();/*json();
    if ("error" in json) {
      throw new Error(JSON.stringify(json));
    }
    */
    console.log('queuePrompt',json)
    return json;
  }

  getImageUrl(filename, subfolder, type) {
    const url =
      `http://${this.serverAddress}/view?` + new URLSearchParams({
        filename,
        subfolder,
        type
      });
    return url;
  }

};

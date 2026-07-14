import axios from "axios";
async function sendRequest() {
    try {
        const response = await axios.post("https://www.nexhook.in/_/backend/api/chatbot-data/sess_cwa9qq1m8y8mqxlkdlh/whatsapp-click", {
            message: "<script>alert('test')</script>"
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log(response.data);
    }
    catch (err) {
        console.error(err.message);
    }
}
sendRequest();
//# sourceMappingURL=testing.js.map
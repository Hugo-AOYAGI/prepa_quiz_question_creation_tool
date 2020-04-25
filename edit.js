
const fs = require("fs");
const request = require('request');

// Get process.stdin as the standard input object.
var standard_input = process.stdin;

// Set input character encoding.
standard_input.setEncoding('utf-8');


ask_inputs = () => {
    
    let step = 0;

    var img_path;
    var path_serv;

    standard_input.on("data", (data_path) => {
        if (step == 0) return;

        path_serv = data_path;

        let formData =  {
            token: "B3cQf31RRRlbaiHNP26dP735FXoWGdJe",
            path: path_serv.replace(/(\r\n|\n|\r)/gm,""),
            image: base64_encode(__dirname + "\\" + img_path.replace(/(\r\n|\n|\r)/gm,""))
        }
    
        // formData = JSON.stringify(formData)

        request.post('https://quiz-app-db.glitch.me/edit', {
            json: formData
        }, (error, res, body) => {
            if (error) {
                console.error(error)
                return
        }
            console.log(`statusCode: ${res.statusCode}`);
            console.log(body);
            console.log("Press CTRL+C to exit.");
        })
        
        

    });


    console.log("Please select the file you want to send to server : ");
    standard_input.on("data", (data) => {
        if (step == 1) return;
        img_path = data;
        console.log("Enter the server path name : ");
        step = 1;
        
    });

    
    
}


base64_encode = (file) => {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

ask_inputs();
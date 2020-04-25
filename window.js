
const fs = require("fs");
const html2canvas = require("html2canvas");
const imagemin = require('imagemin');
const remote = require('electron').remote;

const imageminPngquant = require('imagemin-pngquant');

let categories;
let subjects;

let type_codes = {"QCM": "QCM", "Vrai ou Faux": "TOF", "Flip Card": "CRD"};
let selected_category = "";
let currentType = "Vrai ou Faux";
let ans_nb = 0;
let add_ans = `<div class="add-ans hz-align-margins pointer">+</div>`;

MathJax.Hub.Config({
    extensions: ["tex2jax.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: {
      inlineMath: [ ['$','$'], ["\\(","\\)"] ],
      displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
      processEscapes: true
    },
    "HTML-CSS": { fonts: ["TeX"] }
  });

$(document).ready(() => {

    // Read initial json
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "https://quiz-app-db.glitch.me/json", false);
    xmlHttp.send(null);
    let json_data = JSON.parse(xmlHttp.responseText);
    
    subjects = json_data["subjects"];
    categories = json_data["categories"];

    // Add options in subject select
    addOptions();
    // Add categories
    addCategories();
    // Setup the initial question type
    trueOrFalseSetup();

    // Add event listeners to inputs
    $("#subject").change(addCategories);
    $(".choices").click(selectCategory);
    $(".type").click(selectQuestionType);
    $("#title-area").on("input", updateTitlePreview);
    $("#explanation-area").on("input", updateExplanationPreview);

    // Add event listener to post a new json file to server
    $(".addJson").click((event) => {
        remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openFile']
        }).then((files) => {
            if (files !== undefined) {
                
                let data = JSON.stringify({
                    json: JSON.parse(fs.readFileSync(files.filePaths[0])), 
                    token: $("#auth_token").val()
                });
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open("POST", "https://quiz-app-db.glitch.me/json_post", false);
                xmlHttp.setRequestHeader("Content-type", "application/json");
                xmlHttp.send(data);
            }
        });
    });

});

// Add the options to the subject select
addOptions = () => {
    let txt = "";
    for (let subject of subjects) {
        txt += `<option value='${subject[1]}'>${subject[0]}</option>`
    }
    $("#subject").html(txt);
}

// Get the code version of a subject (ex: "Mathématiques" => "MAT")
getSubjectCode = (subject) => {
    for (let subj of subjects) {
        if (subject == subj[0]) return subject[1];
    }
    return false;
}

// Add categories to webpage
addCategories = () => {
    selected_category = "";
    $(".selected").html("Choisis une catégorie")
    let txt = ""
    for (let category of categories[$("#subject").val()]) {
        txt += `<div class="choice-template upper fw-1 vt-align-flex hz-align-flex pointer">${category[0]}</div>`
    }
    $(".choices").html(txt)
}

// Event to select a new category
selectCategory = (event) => {
    if ($(event.target).hasClass("choices")) return;
    selected_category = event.target.innerText;
    $(".selected").html(event.target.innerText)
}

selectQuestionType = (event) => {
    if (event.target.innerText == currentType) return;
    $(event.target).addClass("isSelected");
    $(".type").children().each((i, child) => {
        if ($(child).context.innerHTML == currentType) {
            $(child).removeClass("isSelected")
            return;
        }
    })
    currentType = event.target.innerText;
    if (currentType == "QCM") QCMSetup();
    else if (currentType == "Vrai ou Faux") trueOrFalseSetup();
    else flipCardSetup();

}


trueOrFalseSetup = () => {
    $(".ans-template").remove();
    $(".add-ans").remove();
    $(".ans-img").remove();

    $(".main-form").append(`<div class="tof-input hz-align-flex"><input type="checkbox" id="tof-checkbox"><label for="tof-checkbox" id="tof" class="true-or-false">VRAI</label></div>`);

}

QCMSetup = () => {
    ans_nb = 0;
    $(".add-ans").remove();
    $(".ans-template").remove();
    $(".ans-img").remove();
    $(".tof-input").remove();

    addAnswer();
    addAnswer();
    
}

flipCardSetup = () => {
    $(".ans-template").remove();
    $(".add-ans").remove();
    $(".ans-img").remove();
    $(".tof-input").remove();

}

addAnswer = (event) => {
    ans_nb++;
    $(".add-ans").remove();
    $(".main-form").append(`<div class="ans-template"><div class="info"><label for="cb-${ans_nb}">Bonne Réponse ?</label><input class="ans-checkbox" id="cb-${ans_nb}" type="checkbox" name="cb-${ans_nb}"><div class="ans-lbl upper fw-9">Réponse n°${ans_nb}</div></div><textarea name="ans" id="ans-area-${ans_nb}" cols="30" rows="3"></textarea></div>`);
    $(".main-form").append(add_ans);
    $(".answer-images-div").append(`<div class="ans-img" id="ans-area-${ans_nb}-img"></div>`);

    $(".add-ans").click(addAnswer);
    $(".ans-template").on("input", updateAnswerPreview);
}

updateTitlePreview = (event) => {
    $(".title-img").html($("#title-area").val())
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

updateExplanationPreview = (event) => {
    $(".explanation-img").html($("#explanation-area").val())
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

updateAnswerPreview = (event) => {
    if ($(event.target).val() == 0) $("#" + $(event.target.id).selector+"-img").html("")
    else $("#" + $(event.target.id).selector+"-img").html($(event.target.id).selector.replace("ans-area-", "") + ". " + $(event.target).val());
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

confirm = () => {
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    MathJax.Hub.Queue(renderCanvas);
}

renderCanvas = () => {
    html2canvas($(".question-div")[0]).then((canvas) => {
            var img = canvas.toDataURL("image/png", "image/octet-stream");
            base64Data  =   img.replace(/^data:image\/png;base64,/, "");
            base64Data  +=  base64Data.replace('+', ' ');
            binaryData  =   new Buffer(base64Data, 'base64').toString('binary');
    
            fs.writeFileSync("images/out.png", binaryData, "binary");
        }
    );
    html2canvas($(".explanation-div")[0]).then((canvas) => {
        var img = canvas.toDataURL("image/png", "image/octet-stream");
        base64Data  =   img.replace(/^data:image\/png;base64,/, "");
        base64Data  +=  base64Data.replace('+', ' ');
        binaryData  =   new Buffer(base64Data, 'base64').toString('binary');

        fs.writeFileSync("images/explanations.png", binaryData, "binary");

        (async () => {
            const files = await imagemin(['images/out.png', 'images/explanations.png'], {
                destination: 'images',
                plugins: [
                    imageminPngquant({
                        quality: [0.4, 0.6]
                    })
                ]
            });
            
            setTimeout(send_data_to_glitch, 2000)
    
        })();


    }
);
}



base64_encode = (file) => {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

send_data_to_glitch = () => {
    if (selected_category == "") {
        alert("Selectionnez une catégorie !")
        return;
    }
    console.log(selected_category);
    var formData = {
        type: type_codes[currentType],
        subject: $("#subject").val(),
        category: getCategoryId($("#subject").val()),
        question: base64_encode("images/out.png"),
        explanations: base64_encode("images/explanations.png"),
        token: $("#auth_token").val()
    };

    if (formData.type == "QCM") {
        formData.answers = []
        for(let i=0; i<ans_nb;i++) {
            formData.answers.push($(`#cb-${i+1}`).is(":checked") ? "1" : "0");
        }
        formData.answers = formData.answers.join("_")
    } else if (formData.type == "TOF") {
        formData.answers = $("#tof-checkbox").is(":checked") ? "0" : "1";
    }

    console.log(formData);

    formData = JSON.stringify(formData)

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "https://quiz-app-db.glitch.me/questions", false); // false for synchronous request
    xmlHttp.setRequestHeader("Content-type", "application/json");
    xmlHttp.send(formData);

    alert("Data sent successfully..");
}

getCategoryId = (subject_code) => {
    for (let category of categories[subject_code]) {
        if (category[0].toUpperCase() == selected_category) {
            return category[1];
        }
    }
}

titleImg = () => {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openFile']
        }).then((files) => {
            if (files !== undefined) {
                $("#title-area").val(
                    $("#title-area").val() + `<image src="${files.filePaths[0]}">`
                );
            }
        }
    );
    updateTitlePreview();
}   

expImg = () => {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openFile']
        }).then((files) => {            
            if (files !== undefined) {
                $("#explanation-area").val(
                    $("#explanation-area").val() + `<image src="${files.filePaths[0]}">`
                );
            }
        }
    );
    updateExplanationPreview();
}   

titleTbl = () => {
    $("#title-area").val(
        $("#title-area").val() + `<table>
        <tbody>
            <tr>
                <td>Col1</td>
                <td>Col2</td>
            </tr>
        </tbody>
      </table>`
    );
    updateTitlePreview();
}

expTbl = () => {
    $("#explanation-area").val(
        $("#explanation-area").val() + `<table>
        <tbody>
            <tr>
                <td>Col1</td>
                <td>Col2</td>
            </tr>
        </tbody>
      </table>`
    );
    updateExplanationPreview();
}


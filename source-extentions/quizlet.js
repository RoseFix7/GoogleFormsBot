{
    const answers = document.querySelectorAll(".SetPageTerms-term");
    let output = [];
    
    answers.forEach((term) => {
        const root = term.children[0].children[0].children[0].children[0];
        const ex_question = root.children[0].children[0].children[0].children[0];
        const ex_answer = root.children[1].children[0].children[0].children[0];
        
        // Question
        const question_lines = ex_question.innerText.split("\n").filter(x => x.length > 0);
        const question = question_lines[question_lines.length - 1];

        console.warn(question);

        // Answer
        const answer = ex_answer.innerText;

        console.log(answer)

        if (answer.toLowerCase() == "true" || answer.toLowerCase() == "t") {
            output.push([question, true]);
        } else if (answer.toLowerCase() == "false" || answer.toLowerCase() == "f") {
            output.push([question, false]);
        } else {
            output.push([question, answer.toLowerCase()]);
        }
    });

   console.log("Please paste the following raw JSON data into the TX Quizlet JSON RAW input along with any other sources");
    console.log(JSON.stringify(output));
}

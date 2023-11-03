{
    const answers = document.querySelectorAll("#setPageSetDetails > div.SetPage-setDetailsTermsWrapper > div > div:nth-child(2) > div > section > div > section > .SetPageTerms-term");
    let output = {};

    answers.forEach((term) => {
        const root = term.children[0].children[0].children[0].children[0];
        const ex_question = root.children[0].children[0].children[0].children[0];
        const ex_answer = root.children[1].children[0].children[0].children[0];

        // Question
        const question_lines = ex_question.innerText.split("\n").filter(x => x.length > 0);
        const question = question_lines[question_lines.length - 1];

        // Answer
        const answer = ex_answer.innerText;

        if (answer.toLowerCase() == "true" || answer.toLowerCase() == "t") {
            output[question] == true;
        } else if (answer.toLowerCase() == "false" || answer.toLowerCase() == "f") {
            output[question] = false;
        } else {
            output[question] = answer.toLowerCase();
        }
    });

    console.log("Please paste the following raw JSON data into the TX Quizlet JSON RAW input along with any other sources");
    console.log(JSON.stringify(output));
}

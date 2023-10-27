{
    function similarity(s1, s2) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
          longer = s2;
          shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
          return 1.0;
        }
        return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
      }

      function editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
      
        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
          var lastValue = i;
          for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
              costs[j] = j;
            else {
              if (j > 0) {
                var newValue = costs[j - 1];
                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                  newValue = Math.min(Math.min(newValue, lastValue),
                    costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
              }
            }
          }
          if (i > 0)
            costs[s2.length] = lastValue;
        }
        return costs[s2.length];
      }

	class Question {
		constructor(root_q_el) {
			this.root = root_q_el;

            const form = Object.values(this.root.children)[0];
			const meta_dat = form.children[0].children[0];
			const response_dat = form.children[0].children[1];
            const ques_dat = form.children[0].children[0];

			if (response_dat != undefined) {
                try {
                    const inner_resp = response_dat.children[1].children[0].children[0].children[0];
                    
                    if (inner_resp && inner_resp.children.length == 2) {
                        this.mode = "boolean";
                        this.buttons = inner_resp;
                        this.options = [true, false];
                    } else if (inner_resp && inner_resp.children.length == 4) {
                        this.mode = "ABCD";
                        this.buttons = inner_resp;
                        this.options = ["A", "B", "C", "D"];

                        for (let i = 0; i < inner_resp.children.length; i++) {
                            const letter_option = inner_resp.children[i];
                            const option = letter_option.children[0].children[0].children[1].children[0].children[0].innerText;

                            if (
                                option.toLowerCase().startsWith("a. ") 
                                || option.toLowerCase().startsWith("b. ")
                                || option.toLowerCase().startsWith("c. ")
                                || option.toLowerCase().startsWith("d. ")
                            ) {
                                this.options.push(option.slice(3));
                            } else {
                                this.options.push(option);
                            }
                        }
                    }
                } catch (e) {
                    this.mode = "string";
                    const inner_resp = response_dat.children[0].children[0].children[0].children[0].children[0];
                    this.buttons = inner_resp;
                }

                try {
                    const inner_resp = ques_dat.children[0].children[0].children[0];
                    this.title = inner_resp.innerText;
                } catch (e) {
                    console.log(e);
                }

                console.log(this);
			}

            console.log("Question initialized");
            console.log(`-- Mode: ${this.mode}`);
            console.log(`-- Name: ${this.title}`);
		}

        answer_boolean(value) {
            return this.list_answer(value ? 0 : 1);
        }

        answer_abcd(value) {
            const data = ["A", "B", "C", "D"].indexOf(value);
            if (data == -1) {
                for (let button = 0; button < this.buttons.children.length; button++) {
                    const letter_option = this.buttons.children[button];
                    const option = letter_option.children[0].children[0].children[1].children[0].children[0];
                    const text = this.options[button + 3];

                    console.log("HI", text);
                }

                return true;
            }

            return this.list_answer(["A", "B", "C", "D"].indexOf(value));
        }

        answer_string(value) {
            if (!this.buttons) return false;
            this.buttons.value = value;
            this.buttons.dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: true,
            }));

            return true;
        }

        list_answer(index) {
            if (!this.buttons) return false;
            this.buttons.children[index].children[0].click();

            return true;
        }
 	}

	function get_questions() {
        const questions = document.querySelector("#mG61Hd > div.RH5hzf.RLS9Fe > div > div.o3Dpx");
        let output = [];

		Object.values(questions.children).forEach((qhtml) => {
			output.push(new Question(qhtml));
		});

        output.forEach((v) => v.mode == "boolean");

        return output;
	}

    class QuestionResolver {
        constructor(questions, mode, left) {
            this.left = left;
            this.questions = questions;
            this.mode = mode;
            this.pointer = 0;
            this.a_pointer = 0;
        }

        answer() {
            const question = this.questions[this.pointer];
            let code = false;

            if (this.mode == "provided") {
                if (question.mode == "boolean") {
                    console.log("Answering Question: DID NOT FETCH");
                    console.log(`-- Mode: ${this.mode} [boolean]; QM = ${question.mode}`);
                    console.log(`-- Answer: ${this.left[this.a_pointer] == "True"}`);
                    code = question.answer_boolean(this.left[this.a_pointer] == "True");
                } else if (question.mode == "ABCD") {
                    console.log("Answering Question: DID NOT FETCH");
                    console.log(`-- Mode: ${this.mode} [ABCD]`);
                    console.log(`-- Answer: ${this.left[this.a_pointer]}`);
                    code = question.answer_abcd(this.left[this.a_pointer]);
                } else if (question.mode = "string") {
                    console.log("Answering Question: DID NOT FETCH");
                    console.log(`-- Mode: ${this.mode} [STRVAL]`);
                    console.log(`-- Answer: ${this.left[this.a_pointer]}`);
                    code = question.answer_string(this.left[this.a_pointer]);
                }
            }

            if (code) this.a_pointer++;
            this.pointer++;
        }

        answer_all() {
            this.questions.forEach(() => {
                this.answer();
            });
        }
    }

    let provider = `T
T
F
T
F
T
F
T
T
T
F
F
F
F
T`.split("\n");

let temp = [];

provider.forEach((t) => {
    if (t == "T") {
        temp.push("True");
    } else {
        temp.push("False");
    }
})

provider = temp;

class ChatGPT_AI {
    constructor() {
        const chat_gpt = document.createElement("iframe");
        const cname = "__xfaon__dev__chat__openai__com__";
        chat_gpt.src = "https://chat.openai.com";
        this.callback = () => {};

        const old = document.querySelector(cname);
        if (old) {
            old.remove();
        }

        const m_ui = document.createElement("div");
        m_ui.classList.add(cname);

        document.body.appendChild(m_ui);
        m_ui.appendChild(chat_gpt);

        chat_gpt.style.width = "100%";
        chat_gpt.style.height = "100%";

        const ready = document.createElement("button");
        m_ui.appendChild(ready);

        ready.addEventListener("click", () => {
            m_ui.style.opacity = 0;
            m_ui.style.pointerEvents = "none";
            this.callback();
        });

        ready.innerText = "Start";

        {
            const style = m_ui.style;

            style.position = "fixed";
            style.top = "50vh";
            style.left = "50vw";

            style.transform = "translate(-50%, -50%)";
            style.width = "75vw";
            style.height = "50vh";
        }
    }

    on_ready(callback) {
        this.callback = callback;
    }
}

const questions = get_questions();
// const revx = new ChatGPT_AI();

// revx.on_ready(() => {
//     const resolver = new QuestionResolver(questions, "provided", provider);
//     resolver.answer_all();
// });

questions.forEach((question, i) => {
    if (i == 0) {
        question.answer_string("based");
    }

    if (i == 1) {
        question.answer_boolean(true);
    }

    if (i == 2) {
        question.answer_abcd("asdsd");
    }
})
}

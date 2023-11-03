{
    function similarity(s1, s2) {
        var longer = s1;
        var shorter = s2;
        console.log(longer, shorter);
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

            this.options = [];

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
                let ratings = [];
                for (let button = 0; button < this.buttons.children.length; button++) {
                    const letter_option = this.buttons.children[button];
                    const option = letter_option.children[0].children[0].children[1].children[0].children[0];
                    const text = this.options[button];

                    ratings.push(similarity(text, value));
                }

                let largest_value = 0;
                let largest_index = 0;

                ratings.forEach((val, index) => {
                    if (val > largest_value) {
                        largest_value = val;
                        largest_index = index;
                    }
                });

                return this.list_answer(largest_index);
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
                    console.log(`Answering Question: ${this.title}`);
                    console.log(`-- Mode: ${this.mode} [boolean]; QM = ${question.mode}`);
                    console.log(`-- Answer: ${this.left[this.a_pointer] == "True"}`);
                    code = question.answer_boolean(this.left[this.a_pointer] == "True");
                } else if (question.mode == "ABCD") {
                    console.log(`Answering Question: ${this.title}`);
                    console.log(`-- Mode: ${this.mode} [ABCD]`);
                    console.log(`-- Answer: ${this.left[this.a_pointer]}`);
                    code = question.answer_abcd(this.left[this.a_pointer]);
                } else if (question.mode = "string") {
                    console.log(`Answering Question: ${this.title}`);
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

        // Requester: (query, options, type) => boolean | string
        answer_all_engine() {
            this.questions.forEach((question, index) => {
                if (!question.title || question.title.length == 0)
                    return console.error(`-- Exception: Question ${index + 1} could not be parsed, skipping`);

                const result = this.left(
                    question.title,
                    question.mode == "ABCD" ? question.options.splice(0, 4) : question.options,
                    question.mode
                );

                console.log(`Attempting to answer question "${question.title}"`);
                console.log(`-- Mode: ${question.mode}`);
                console.log(`-- Options: ${question.options.join(", ")}`);
                console.log(`-- Fetched answer: "${result}"`);

                switch (question.mode) {
                    case "boolean":
                        question.answer_boolean(result);
                        break;

                    case "ABCD":
                        question.answer_abcd(result);
                        break;

                    case "string":
                        question.answer_string(result);
                        break;
                }
            });
        }
    }

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

const table = {
    "Are cats giga based": true,
    "Untitled": "uw",
    "This bot is mega": "based"
}

function get_closest_index(test, strings) {
    let similarities = [];

    strings.forEach((str) => {
        similarities.push(similarity(test, str));
    });
    
    let largest_index = 0;
    let largest_sim = 0;

    similarities.forEach((sim, index) => {
        if (sim > largest_sim) {
            largest_sim = sim;
            largest_index = index;
        }
    });

    return largest_index;
}

function table_engine(query, options, type, table) {
    const closest = get_closest_index(query, Object.keys(table));
    const answer = Object.values(table)[closest];

    if (type == "boolean" && typeof answer != "boolean") {
        console.error("Failed");
        console.error(Object.values(table));
        console.error(closest);
    } else {
        return answer;
    }

    console.log(answer);

    if (type == "ABCD") {
        return options[get_closest_index(answer, options)];
    }

    return answer;
}

// const questions = get_questions();
// // const revx = new ChatGPT_AI();

// // revx.on_ready(() => {
// //     const resolver = new QuestionResolver(questions, "provided", provider);
// //     resolver.answer_all();
// // });

// // Requester: (query, options, type) => boolean | string
// const resolver = new QuestionResolver(questions, "provided", (query, options, type) => {
//     return table_engine(query, options, type, table);
// });

// resolver.answer_all_engine();
  
  function panel() {
    const p = document.createElement("div");
    const style = p.style;
    
    style.display = "flex";
    style.position = "fixed";
    style.top = "50vh";
    style.left = "50vw";
    style.transform = "translate(-50%, -50%)";
    
    style.background = "#0e0e0e";
    style.borderRadius = "4px";
    style.overflow = "auto";
    style.padding = "10px";
    style.flexDirection = "column";
    style.gap = "10px";
    style.width = "75vw";
    style.height = "400px";
    
    return p;
  }
  
  function text(str) {
    const text = document.createElement("span");
    const style = text.style;
    
    style.color = "#fff";
    style.fontSize = "13px";
    
    text.innerText = str;
    
    return text;
  }
  
  function input() {
    const i = document.createElement("input");
    const style = i.style;
    
    style.background = "rgba(255, 255, 255, 6%)";
    style.outline = "none";
    style.border = "none";
    style.borderBottom = "1px solid rgba(255, 255, 255, 10%)";
    style.borderRadius = "4px";
    style.padding = "10px 20px";
    style.width = "100%";
    style.color = "#FFF";
    
    return i;
  }
  
  function button(str) {
    const btn = document.createElement("button");
    const style = btn.style;
    
    btn.innerText = str;
    
    style.color = "#00FFA3";
    style.padding = "10px 20px";
    style.background = "rgba(255, 255, 255, 6%)";
    style.border = "none";
    style.borderRadius = "4px";
    
    return btn;
  }
  
  function column() {
    const c = document.createElement("div");
    const style = c.style;
    
    style.display = "flex";
    style.gap = "10px";
    style.flexDirection = "column";
    
    return c;
  }
  
  function row() {
    const r = column();
    r.style.flexDirection = "row";
    r.style.width = "100%";
    r.style.justifyContent = "space-between";
    r.style.alignItems = "center";
    
    return r;
  }
  
  function setting(name, callback, type = "string") {
    const rows = column();
    rows.appendChild(text(name));
    
    const field = row();
    const i = input();
    const save = button("Save");
    const toggle = button("Disabled");
    
    let state = type == "string" ? true : false;

    if (type == "boolean" || type == "boolean-only")
      field.appendChild(toggle);
    if (type != "boolean-only")
      field.appendChild(i);
    
    function apply() {
      if (state) {
        toggle.innerText = "Enabled";
        i.style.opacity = "1";
        i.style.pointerEvents = "all";
      } else {
        toggle.innerText = "Disabled";
        i.style.opacity = "0.6";
        i.style.pointerEvents = "none";
      }
    }
    
    apply();
    
    toggle.addEventListener("click", () => {
      state = !state;
      
      apply();
      
      callback(state);
    });
      
    if (type != "boolean-only") {
      field.appendChild(save);
    }
    
    rows.appendChild(field);
    
    save.addEventListener("click", () => {
      callback(i.value);
    });
    
    return rows;
  }
  
  const tb = row();
  const start = button("Start");
  
  tb.appendChild(text("Google Forms Automatic Completion Manager"));
  tb.appendChild(start);
  
  const cp = panel();
  
  const config = {
    constant_order: false
  }
  
  cp.appendChild(tb);
  
  cp.appendChild(setting("TX Quizlet Output JSON RAW", (d) => {
  }));
  
  cp.appendChild(setting("Enable Chat GPT Fallback (BROKEN)", (d) => {
  }, "boolean-only"));
  
  cp.appendChild(setting("Enable XUSYNC Execution (SLOW MODE)", (d) => {
  }, "boolean-only"));
  
  cp.appendChild(setting("Enable Contant Order Answers [Provide List of answers, Seprated by a semicolon]", (d) => {
  }, "boolean"));
  document.body.appendChild(cp);
  document.head.innerHTML += `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap" rel="stylesheet"> <style> * { font-family: 'JetBrains Mono', monospace; }</style>`;
}

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
                    console.error(e);
                }
			}

            // console.log("Question initialized");
            // console.log(`-- Mode: ${this.mode}`);
            // console.log(`-- Name: ${this.title}`);
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
          
          this.handle_fault = () => {};
        }

        answer() {
            const question = this.questions[this.pointer];
            let code = false;

            if (this.mode == "provided") {
                if (question.mode == "boolean") {
                    // console.log(`Answering Question: ${this.title}`);
                    // console.log(`-- Mode: ${this.mode} [boolean]; QM = ${question.mode}`);
                    // console.log(`-- Answer: ${this.left[this.a_pointer] == "True"}`);
                    code = question.answer_boolean(this.left[this.a_pointer] == "True");
                } else if (question.mode == "ABCD") {
                    // console.log(`Answering Question: ${this.title}`);
                    // console.log(`-- Mode: ${this.mode} [ABCD]`);
                    // console.log(`-- Answer: ${this.left[this.a_pointer]}`);
                    code = question.answer_abcd(this.left[this.a_pointer]);
                } else if (question.mode = "string") {
                    // console.log(`Answering Question: ${this.title}`);
                    // console.log(`-- Mode: ${this.mode} [STRVAL]`);
                    // console.log(`-- Answer: ${this.left[this.a_pointer]}`);
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
      
        set_fault_handler(handler) {
          this.handle_fault = handler; 
        }
      
        resume(index) {
          const questions = this.questions.filter((_, i) => i >= index);
          this.answer_all_engine(questions, index);
        }

        // Requester: (query, options, type) => boolean | string
        answer_all_engine(q_array = null, trick_offset = 0) {
          let halt = false;
          let halt_trace = null;
            (q_array != null ? q_array : this.questions).forEach((question, index) => {
              if (halt) {
                return;
              }
                            
                if (!question.title || question.title.length == 0)
                    return console.error(`-- Exception: Question ${index + 1} could not be parsed, skipping. Likly header`);

                const result_x = this.left(
                    question.title,
                    question.mode == "ABCD" ? question.options.splice(0, 4) : question.options,
                    question.mode
                );
              
              const result = result_x.value;
              
              halt_trace = {
                result: result_x,
                question,
                index: index + trick_offset
              }
                            
              if (result_x.failed) {
                halt = true;
                this.handle_fault(halt_trace);
                
                return;
              }
                // console.log(`Attempting to answer question "${question.title}"`);
                // console.log(`-- Mode: ${question.mode}`);
                // console.log(`-- Options: ${question.options.join(", ")}`);
                // console.log(`-- Fetched answer: "${result}"`);

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
      
      if (halt) {
        console.error("FAULT")
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

    return { 
      value: largest_index,
      sim: largest_sim
    };
}

function table_engine(query, options, type, table, threash = 0.0) {
    const closest_x = get_closest_index(query, Object.keys(table));
    const closest = closest_x.value;
    const answer = Object.values(table)[closest];
  
  console.log(answer);
  
    if (closest_x.sim <= threash) {
      return {
          value: answer,
          failed: true,
          sim: closest_x.sim
      };
    }
  

    if (type == "boolean" && typeof answer != "boolean") {
        console.error("Failed");
        console.error(Object.values(table));
        console.error(closest);
      
        return {
          value: answer,
          failed: true,
          sim: closest_x.sim
        };
    } else {
        return {
          value: answer,
          failed: false,
          sim: closest_x.sim
        };
    }

  console.log("##### INCOMING PACKET #####")
    // console.log(answer);

    if (type == "ABCD") {
        return options[get_closest_index(answer, options)];
    }

    return {
      value: answer,
      failed: true,
      sim: closest_x.sim
    };
}

// const questions = get_questions();
// // const revx = new ChatGPT_AI();

// // revx.on_ready(() => {
// //     const resolver = new QuestionResolver(questions, "provided", provider);
// //     resolver.answer_all();
// // });

// Requester: (query, options, type) => boolean | string

// resolver.answer_all_engine();
  
  function transform_quizlet_json(quizlet_json = []) {
    const final = {};
    
    quizlet_json.forEach((str_json) => {
      try {
        const parsed = JSON.parse(str_json);
        const keys = Object.keys(parsed);
        
        keys.forEach(key => {
          final[key] = parsed[key];
        });
      } catch (error) {
        console.error(error);
      }
    });
    
    return final;
  }
  
  function transform_order(obj) {
    const keys = Object.keys(obj);
    let result = {};
    
    keys.forEach((key) => {
      if (key.length < (obj[key] + "").length) {
        result[obj[key] + ""] = key + "";
        
        if (result[obj[key]] == "true") {
          result[obj[key]] = true;
        } else if (result[obj[key]] == "false") {
          result[obj[key]] = false;
        }
      } else {
        result[key] = obj[key];
      }
    })
    
    return result;
  }
  
    let show_panel = true;
  
  function start_full_program(cfg) {
    if (cfg.accept != "Accept") {
      const error = column();
      
      const message = text("You may not use this tool until you have indicated your acknowledgment of risks");
      const close = button("Close");
      
      close.addEventListener("click", () => {
        dismiss_EM();
      });
      
      error.appendChild(message);
      error.appendChild(close);
      
      spawn_EM(error);
      
      show_panel = true;
      load_all_units();
      return;
    }
    
    let quizlet_data = transform_quizlet_json(cfg.quizlet_json);
    
    // Long order
    {
      if (cfg.long_order) {
        quizlet_data = transform_order(quizlet_data);
      }  
    }
    
    const questions = get_questions();
    const resolver = new QuestionResolver(questions.filter(q => q.title && q.title.length > 0), "provided", (query, options, type) => {
        return table_engine(query, options, type, quizlet_data, cfg.threash);
    });
    
    resolver.set_fault_handler((trace) => {
      // Behaviors
      // "Ask For Answer"
      // "Reset"
      // "Select First Option"
      // "Random Pick"
      
      const { index, result, question } = trace;
      
      const error = column();
      
      const lines = [
        text("ERROR! Question resolution fault"),
        text(`Question: ${question.title}`),
        text(`Identifier: ${index}`),
        text(`Closest answer: ${result.value} (Approximate Accuracy: ${(result.sim * 100).toString().slice(0, 4)}%`)
      ];
      
      lines.forEach(line => error.appendChild(line));
      error.appendChild(br());
      
      let flash_state = true;
      let loop = 0;
      
      function flash_loop() {
        const root = question.root.children[0].children[0];
        
        if (flash_state) {
          root.style.background = "#FF004D09";
          root.style.borderColor = "#FF004D";
        } else {
          root.style.background = "#FFFFFF";
          root.style.borderColor = "#dadce0";
        }
        
        flash_state = !flash_state;
      }
      
      function start_flash() {
        loop = setInterval(flash_loop, 500);
      }
      
      function stop_flash() {
        clearInterval(loop);
      }
      
      const action_row = row();
      
      const submit = button("Resolve");
      action_row.style.justifyContent = "flex-end";
      
      function clean() {
        dismiss_EM();
        stop_flash();
        flash_state = false;
        flash_loop();
      }
      
      {
        start_flash();
        question.root.scrollIntoView();
        
          // function setting(name, callback, type = "string", default_value = false, select_obj = []) {
        if (cfg.fault_behavior == "Ask For Answer") {
          if (question.mode == "boolean") {
            const select = setting(question.title, (d) => {
              
            }, "select", "True", [ "True", "False" ]);
            
            error.appendChild(select);
          } else if (question.mode == "ABCD") {
            
          } else if (question.mode == "string") {
            
          } else {
            const error_res = text("Malformed question object, please report this bug to Rayyan!");
          }
        }
      }
      
      submit.addEventListener("click", () => {
        clean();
        question.answer_boolean(true); // TODO: Fix
        resolver.resume(index + 1);
      });
      
      const close = button("Close");
          
      close.addEventListener("click", () => {
        clean();
      });
      
      action_row.appendChild(close);
      action_row.appendChild(submit);

      error.appendChild(action_row);

      spawn_EM(error, true);
    });
    
    resolver.answer_all_engine();
  }
  
  function panel() {
    const p = document.createElement("div");
    const style = p.style;
    
    style.display = "flex";
    style.position = "fixed";
    style.top = "0vh";
    style.left = "0vw";
    
    style.background = "#0e0e0e";
    style.borderRadius = "4px";
    style.overflow = "auto";
    style.padding = "10px";
    style.flexDirection = "column";
    style.gap = "10px";
    style.width = "100vw";
    style.height = "100vh";
    
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
  
  function pre_text(str) {
    const text = document.createElement("pre");
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
    
    style.color = "#FFF";
    style.padding = "10px 20px";
    style.background = "rgba(255, 255, 255, 6%)";
    style.border = "1px solid transparent";
    style.borderRadius = "4px";
    
    btn.addEventListener("mouseover", () => {
      style.border = "1px solid rgba(255, 255, 255, 20%)";
    });
    
    btn.addEventListener("mouseleave", () => {
      style.border = "1px solid rgba(255, 255, 255, 0%)";
    });
    
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
    r.style.borderRadius = "4px";
    
    return r;
  }
  
  function empty_element(node) {
    while (node.hasChildNodes()) { 
        node.removeChild(node.firstChild);
    }
  }
  
  function setting(name, callback, type = "string", default_value = false, select_obj = []) {
    const super_parent = column();
        let state = type == "string" ? true : default_value;
    
    let current_select = default_value + "";

    
    const rows = column();
    
    rows.appendChild(text(name));
    
    let data_filled = [
      JSON.stringify({ "A pure inductive circuit is an AC circuit with no resistance.": true,"Kirchhoff's voltage law states that the algebraic sum of the voltage in a closed-loop circuit is equal to zero": true, false: "Current in an inductive AC circuit can be calculated without knowing source voltage." })
    ];
    const data_elements = column();
    const select_elements = column();
    
    function load_select() {
      empty_element(select_elements);
      select_elements.style.gap = "1px";
      
      select_obj.forEach((opt) => {
        const opt_el = row();
        const label = text(opt);
        
        opt_el.appendChild(label);
        
        opt_el.style.background = "rgba(255, 255, 255, 6%)";
        opt_el.style.padding = "10px";
        
        if (current_select == opt) {
          opt_el.style.background = "#FF004D";
          label.style.color = "#0b0b0b";
        }
        
        opt_el.addEventListener("click", () => {
          current_select = opt;
          load_select();
          
          callback(opt);
        });
        
        select_elements.appendChild(opt_el);
      });
    }
    
    function load_list() {
      empty_element(data_elements);
      data_elements.style.gap = "1px";
      
      data_filled.forEach((data, index) => {
        const delete_btn = button("Delete");
        
        let data_parsed = data.substring(0, 50);
        
        const d_length = data.length;
        const dp_length = data_parsed.length;
        const expand = button("Expand");
        
        let overflow = false;
        let overflow_shown = false;
        
        if (dp_length < d_length) {
          overflow = true;
          data_parsed += "...";
        }
        
        
        const value = pre_text(data_parsed);
        
        try {
          JSON.parse(data);
          value.style.color = "#FFF";
        } catch (e) {
          value.style.color = "#FF004D";
        }
        
        function apply_ov() {
          if (overflow_shown) {
            expand.innerText = "Compact";
            try {
              value.innerText = JSON.stringify(JSON.parse(data), '\n', '\t');
            } catch (e) {
              value.innerText = data;
            }
          } else {
            expand.innerText = "Expand";
            value.innerText = data_parsed;
          }
        }
        
        apply_ov();
        
        expand.addEventListener("click", () => {
          overflow_shown = !overflow_shown;
          apply_ov();
        });
        
        const container = row();
        container.appendChild(value);
        
        const buttons = row();
        
        buttons.style.justifyContent = "flex-end";
        
        if (overflow) {
          buttons.appendChild(expand);
        }
        buttons.appendChild(delete_btn);
        
        container.appendChild(buttons);
               
        if (state) {
          container.style.background = "rgba(255, 255, 255, 6%)";
        } else {
          container.style.background = "rgba(255, 255, 255, 20%)";
        }
        
        container.style.padding = "10px";
        
        delete_btn.addEventListener("click", () => {
          data_filled.splice(index, 1);
          load_list();
        });
        
        data_elements.appendChild(container);
      });
    }
    
    load_list();
    load_select();
    
    const field = row();
    const i = input();
    const save = button(type == "list" || type == "list-boolean" ? "Add" : "Save");
    const toggle = button("Disabled");
       
    const list_mode = type == "list" || type == "list-boolean";
    const select_mode = type == "select" || type == "select-boolean";
    const boolean_mode = type == "list-boolean" || type == "boolean" || type == "boolean-only" || type == "select-boolean";
    
    if (!boolean_mode) {
      state = true;
      apply();
    }
    
    if (list_mode) {
      i.placeholder = "...";
    } else {
      i.placeholder = "Value";
    }

    if (type == "boolean" || type == "boolean-only" || type == "list-boolean")
      field.appendChild(toggle);
    if (type != "boolean-only" && !select_mode)
      field.appendChild(i);
    
    function apply() {
      if (state) {
        toggle.innerText = "Enabled";
        i.style.background = "rgba(255, 255, 255, 6%)";
        i.style.pointerEvents = "all";
        data_elements.style.opacity = "1";
        data_elements.style.pointerEvents = "all";

        toggle.style.color = "#50FFAB";
        save.style.color = "#FFF";
        save.style.background = "rgba(255, 255, 255, 6%)";
      } else {
        toggle.innerText = "Disabled";
        i.style.background = "rgba(255, 255, 255, 10%)";
        i.style.pointerEvents = "none";
        data_elements.style.opacity = "0.6";
        data_elements.style.pointerEvents = "none";

        toggle.style.color = "#FF0060";
        save.style.color = "#777";
        save.style.background = "rgba(255, 255, 255, 10%)";
      }
      
      load_list();
    }
    
    apply();
    
    toggle.addEventListener("click", () => {
      state = !state;
      
      apply();
      
      callback(state);
    });
      
    if (!(boolean_mode && !select_mode && !list_mode) && !select_mode) {
      field.appendChild(save);
    }
    
    rows.appendChild(field);
    
    function click_event() {
      if (list_mode) {
        data_filled.push(i.value);
        i.value = "";
        
        load_list();
        callback(data_filled)
      } else if (state) {
        callback(i.value);
      }
    }
    
    save.addEventListener("click", () => {
      click_event();
    });
    
    super_parent.appendChild(rows);
    
    if (list_mode) {
      super_parent.appendChild(data_elements);
    } else if (select_mode) {
      super_parent.appendChild(select_elements);
    }
    
    if (list_mode) {
      callback(data_filled)
    } else if (boolean_mode) {
      callback(state);
    } else if (select_mode) {
      callback(current_select);
    } else  {
      i.value = default_value;
      callback(default_value);
    }
    
    return super_parent;
  }
  
  function br() {
    return document.createElement("br");
  }
  
  const E_MODAL = panel();
  const emt = text("Error??")
  
  let E_MODAL_OPEN = false;
  
  E_MODAL.style.width = "50vw";
  E_MODAL.style.padding = "10px";
  E_MODAL.style.height = "initial";
  E_MODAL.style.top = "50vh";
  E_MODAL.style.left = "50vw";
  E_MODAL.style.transform = "translate(-50%, -50%)";
  E_MODAL.style.border = "1px solid rgba(255, 255, 255, 20%)";
    
  E_MODAL.appendChild(emt);
  
  function process_EM() {
    if (E_MODAL_OPEN) {
      E_MODAL.style.opacity = "1";
      E_MODAL.style.pointerEvents = "all";
    } else {
      E_MODAL.style.opacity = "0";
      E_MODAL.style.pointerEvents = "none";
    }
  }
  
  process_EM();
  
  function dismiss_EM() {
    E_MODAL_OPEN = false;
    process_EM();
  }
  
  function spawn_EM(inner_content, is_error = false) {
    E_MODAL_OPEN = true;
    
    empty_element(E_MODAL);
    E_MODAL.appendChild(inner_content);
    
    if (is_error) {
      E_MODAL.style.borderColor = "#FF004D";
    } else {
      E_MODAL.style.borderColor = "rgba(255, 255, 255, 20%)";
    }
     
    process_EM();
  }
    
  const tb = row();
  const start = button("Start");
  
  tb.appendChild(text("Google Forms Automatic Completion Manager"));
  tb.appendChild(start);
  
  const cpx = panel();
  
    function load_all_units() {
    if (show_panel) {
      cpx.style.opacity = "1";
      cpx.style.pointerEvents = "all";
    } else {
      cpx.style.opacity = "0";
      cpx.style.pointerEvents = "none";
    }
  }
  
  load_all_units();
  
  const control_button = button("Toggle Resolver");
  
  control_button.style.position = "fixed";
  control_button.style.bottom = "10px";
  control_button.style.right = "10px";
  control_button.style.background = "#0e0e0e";
  
  control_button.addEventListener("click", () => {
    show_panel = !show_panel;
    load_all_units(); //
  });
  
  const config_formed = pre_text("...");
  
  const config = {
    quizlet_json: [],
    x_usync: false,
    filter: false,
    long_order: false,
    fault_behavior: "Ask For Answer",
    threash: 0,
    accept: false
  }
  
  const cp = column();
  cp.style.gap = "10px";
  cp.style.padding = "0px";
  
  cpx.appendChild(tb);
  
  cpx.appendChild(setting("I acknowlege the risks of using this program, such as breach of student integrity, poor grade, and poor performance.", (d) => {
    config.accept = d;
    
    if (config.accept == "Decline") {
      cp.remove();
    } else {
      cpx.appendChild(cp);
    }
  }, "select", "Accept", [
    "Accept",
    "Decline"
  ]));
  
  cp.appendChild(setting("TX Quizlet Output JSON RAW", (d) => {
    config.quizlet_json = d;
  }, "list"));
 
  // cp.appendChild(setting("Enable Chat GPT Fallback (BROKEN)", (d) => {
  // }, "boolean-only"));
  
  cp.appendChild(setting("Match certainty threashhold [number]", (d) => {
      config.threash = d;
    }, "string", "0.9"));
  
  cp.appendChild(setting("[Recommended for Engineering Quizlets] Use longests value as question, shortest as answer", (d) => {
    config.long_order = d;
  }, "boolean-only", true));
  
  cp.appendChild(setting("[Recommended for Engineering Quizlets] Filter only alphanumeric charachters (A-Z;a-z;0-9)", (d) => {
    config.filter = d;
  }, "boolean-only", true));
  
  cp.appendChild(setting("Enable XUSYNC Execution (SLOW MODE)", (d) => {
    config.x_usync = d;
  }, "boolean-only"));
  
  cp.appendChild(setting("Answer fault resolution behavior", (d) => {
    config.fault_behavior = d;
  }, "select", "Ask For Answer", [
    "Ask For Answer",
    "Reset",
    "Select First Option",
    "Random Pick"
  ]));
  
  start.addEventListener("click", () => {
    show_panel = false;
    load_all_units();
    
    start_full_program(config);
  });
  
  const get_config_rendered = button("Get Run Object");
  
  get_config_rendered.addEventListener("click", () => {
    let parsed = "...";
    try {
      parsed = JSON.stringify(config, "\n", "\t");
      config_formed.style.color = "#FFF";
    } catch (e) {
      config_formed.style.color = "red";
    }
    
    config_formed.innerText = parsed;
  });
  
  cp.appendChild(get_config_rendered);
  cp.appendChild(config_formed);
  
  cpx.appendChild(cp);
  
  document.body.appendChild(cpx);
  document.body.appendChild(control_button);
  document.body.appendChild(E_MODAL);
  
  const style_data = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap" rel="stylesheet"> <style> * { font-family: 'JetBrains Mono', monospace; } * { box-sizing: border-box; transition: 150ms; }</style>`;
  
  document.head.innerHTML += style_data;
}

// Unit 1 Ancient History — Study Guide Practice Questions
// 7th grade History. Built from the Unit 1 Summative Assessment Study Guide.
//
// Two kinds of questions:
//   Multiple choice: { id, topic, question, answer, distractors[], explanation }
//       The app shows all choices (answer + distractors), shuffled. Keep 3 distractors = 4 short choices.
//   Fill in the blank: add  "type": "blank"  and put {blank} in the sentence where the word goes.
//       She drags a word chip into the blank (or just taps it). answer + distractors become the chips.
//       Example: { id, topic, type: "blank", question: "A {blank} source is firsthand.", answer: "primary", distractors: ["secondary"], explanation }
//   In any question text, wrap a word in *asterisks* to highlight it (e.g. *primary*).
//
// To edit: change the text right here. No build step, no dependencies.
// Loaded by history-practice.html via <script src="history-questions.js">.

const historyQuizData = [

  // ================= Timeline, BCE & CE =================
  {
    "id": "h01", "topic": "Timeline & Dates",
    "question": "What does BCE stand for?",
    "answer": "Before Common Era",
    "distractors": ["Before Christian Era", "Big Common Era", "Best Common Era"],
    "explanation": "BCE means Before Common Era. These are the years before year 1."
  },
  {
    "id": "h02", "topic": "Timeline & Dates",
    "question": "What does CE stand for?",
    "answer": "Common Era",
    "distractors": ["Christian Era", "Central Era", "Current Era"],
    "explanation": "CE means Common Era. These are the years from year 1 up to today."
  },
  {
    "id": "h03", "topic": "Timeline & Dates",
    "question": "On a timeline, which way do the BCE years go from zero?",
    "answer": "To the left",
    "distractors": ["To the right", "Straight up", "Straight down"],
    "explanation": "On a timeline, BCE years go to the LEFT of zero. CE years go to the right."
  },
  {
    "id": "h04", "topic": "Timeline & Dates",
    "question": "On a timeline, which way do the CE years go from zero?",
    "answer": "To the right",
    "distractors": ["To the left", "Straight up", "In a circle"],
    "explanation": "CE years go to the RIGHT of zero. BCE years go to the left."
  },
  {
    "id": "h05", "topic": "Timeline & Dates",
    "question": "Which time period comes *first* in history?",
    "answer": "BCE",
    "distractors": ["CE", "They happen at the same time", "Neither one"],
    "explanation": "BCE comes first. It is all the years before the Common Era (CE)."
  },
  {
    "id": "h06", "topic": "Timeline & Dates",
    "question": "Which happened *longer ago*: 500 BCE or 100 BCE?",
    "answer": "500 BCE",
    "distractors": ["100 BCE", "They are the same", "Neither is in the past"],
    "explanation": "In BCE, bigger numbers are further back in time. So 500 BCE is longer ago than 100 BCE."
  },
  {
    "id": "h07", "topic": "Timeline & Dates",
    "question": "What number is at the center of the timeline, where BCE meets CE?",
    "answer": "Zero",
    "distractors": ["One hundred", "One thousand", "There is no center"],
    "explanation": "The center of the timeline is labeled zero. BCE is on the left, CE is on the right."
  },

  // ================= Primary & Secondary Sources =================
  {
    "id": "h08", "topic": "Sources",
    "question": "What is a primary source?",
    "answer": "An original, firsthand account from someone who was there",
    "distractors": ["A story from someone who was not there", "A made-up story", "A source that is always wrong"],
    "explanation": "A primary source is original and firsthand. It comes from someone who was actually there."
  },
  {
    "id": "h09", "topic": "Sources",
    "question": "Which of these is a *primary* source?",
    "answer": "A photograph taken at the event",
    "distractors": ["A textbook written years later", "A news article about the event", "A biography of a leader"],
    "explanation": "A photograph, interview, or speech is a primary source. It is firsthand from someone who was there."
  },
  {
    "id": "h10", "topic": "Sources",
    "question": "Which of these is a *primary* source?",
    "answer": "An interview with a person who was there",
    "distractors": ["A book written 100 years later", "A magazine article", "A summary in a study guide"],
    "explanation": "An interview with someone who was there is a primary (firsthand) source."
  },
  {
    "id": "h11", "topic": "Sources",
    "question": "A diary written by a soldier during a war is what kind of source?",
    "answer": "A primary source",
    "distractors": ["A secondary source", "Not a source at all", "A map"],
    "explanation": "The soldier was there and wrote it himself, so his diary is a primary source."
  },
  {
    "id": "h12", "topic": "Sources",
    "question": "What is a secondary source?",
    "answer": "A secondhand source from someone who was not there",
    "distractors": ["A firsthand account from someone who was there", "A photo taken during the event", "A person's own diary"],
    "explanation": "A secondary source is secondhand. It is made by people who were not there."
  },
  {
    "id": "h13", "topic": "Sources",
    "question": "Which of these is a *secondary* source?",
    "answer": "A history textbook",
    "distractors": ["A photograph from the event", "A speech given at the event", "A letter written that day"],
    "explanation": "Books, articles, and documents written later are secondary sources."
  },
  {
    "id": "h14", "topic": "Sources",
    "question": "Which of these is a *secondary* source?",
    "answer": "An article written about an event",
    "distractors": ["A video recorded at the event", "An interview with a witness", "A diary from that day"],
    "explanation": "An article written about an event afterward is a secondary source."
  },
  {
    "id": "h15", "topic": "Sources",
    "question": "A textbook written today about ancient Egypt is what kind of source?",
    "answer": "A secondary source",
    "distractors": ["A primary source", "A firsthand account", "Not a source"],
    "explanation": "No one alive today was in ancient Egypt, so a textbook about it is a secondary source."
  },

  // ================= Perspectives in History =================
  {
    "id": "h16", "topic": "Perspectives",
    "question": "Why is it important to study more than one perspective in history?",
    "answer": "To get as many viewpoints and as much information as possible",
    "distractors": ["To make history shorter", "So you only hear one side", "To skip the boring parts"],
    "explanation": "Studying many perspectives gives you more information and more points of view, so you understand the whole story."
  },
  {
    "id": "h17", "topic": "Perspectives",
    "question": "What does 'perspective' mean?",
    "answer": "A person's point of view",
    "distractors": ["A kind of map", "A year on a timeline", "A firsthand photo"],
    "explanation": "A perspective is a person's point of view — the way they see and understand something."
  },
  {
    "id": "h18", "topic": "Perspectives",
    "question": "Two people describe the same battle very differently. Why?",
    "answer": "They have different perspectives",
    "distractors": ["One of them is lying", "History has no facts", "They read the same book"],
    "explanation": "People can have different perspectives, so they may describe the same event in different ways."
  },
  {
    "id": "h19", "topic": "Perspectives",
    "question": "Which is a good example of an event with more than one perspective?",
    "answer": "A war, where each side tells the story differently",
    "distractors": ["The number 500 BCE", "A blank timeline", "A map legend"],
    "explanation": "A war is a great example — each side sees and tells the story from its own perspective."
  },

  // ================= Physical Features & Geography =================
  {
    "id": "h20", "topic": "Geography",
    "question": "What are physical features?",
    "answer": "The natural landscape of an area",
    "distractors": ["Buildings people make", "Rules a country makes", "A person's point of view"],
    "explanation": "Physical features are the natural landscape of an area, like mountains and rivers."
  },
  {
    "id": "h21", "topic": "Geography",
    "question": "Which of these is a physical feature?",
    "answer": "A mountain",
    "distractors": ["A city", "A road", "A school"],
    "explanation": "A mountain is natural, so it is a physical feature. Cities, roads, and schools are made by people."
  },
  {
    "id": "h22", "topic": "Geography",
    "question": "Which of these is a physical feature?",
    "answer": "A river",
    "distractors": ["A bridge", "A house", "A highway"],
    "explanation": "A river is a natural physical feature. Bridges, houses, and highways are human-made."
  },
  {
    "id": "h23", "topic": "Geography",
    "question": "Which one is *not* a physical feature?",
    "answer": "A city",
    "distractors": ["A lake", "A desert", "An ocean"],
    "explanation": "A city is built by people, so it is not a physical feature. Lakes, deserts, and oceans are natural."
  },
  {
    "id": "h24", "topic": "Geography",
    "question": "Which list is made up of *only* physical features?",
    "answer": "Mountains, lakes, rivers, deserts, oceans",
    "distractors": ["Cities, roads, bridges, schools", "Books, articles, photos", "Rivers, cities, roads, oceans"],
    "explanation": "Mountains, lakes, rivers, deserts, and oceans are all natural physical features."
  },
  {
    "id": "h25", "topic": "Geography",
    "question": "A place's human characteristics are shaped by what two things?",
    "answer": "Its physical geography and the culture of its people",
    "distractors": ["Only its weather", "Only its timeline", "Its maps and legends"],
    "explanation": "Human characteristics are shaped by both the land (physical geography) and the culture of the people."
  },
  {
    "id": "h26", "topic": "Geography",
    "question": "People who live next to a river might use it to do what?",
    "answer": "Fish, farm, or travel and trade",
    "distractors": ["Climb to the top of it", "Ski down it", "Turn it into a city rule"],
    "explanation": "Physical features shape how people live. A river lets people fish, farm nearby, and travel or trade."
  },

  // ================= Reading Maps =================
  {
    "id": "h27", "topic": "Maps",
    "question": "What two things can you look at to find out what a map is about?",
    "answer": "The title and the legend (key)",
    "distractors": ["The price and the size", "The author and the date", "The color and the shape"],
    "explanation": "Look at the map's title and its legend (also called the key) to learn what it is about."
  },
  {
    "id": "h28", "topic": "Maps",
    "question": "What does a map's legend (key) do?",
    "answer": "It explains what the symbols and colors mean",
    "distractors": ["It tells you the year", "It lists the author's name", "It gives the price of the map"],
    "explanation": "A legend, or key, explains what the map's symbols and colors stand for."
  },
  {
    "id": "h29", "topic": "Maps",
    "question": "The TITLE of a map tells you what?",
    "answer": "What the map is about",
    "distractors": ["What the symbols mean", "Who drew it", "How old it is"],
    "explanation": "The title tells you the subject of the map — what it is about. The legend explains the symbols."
  },
  {
    "id": "h30", "topic": "Maps",
    "question": "Another word for a map's legend is the...",
    "answer": "Key",
    "distractors": ["Title", "Border", "Scale"],
    "explanation": "A legend is also called a key. It explains the symbols and colors on the map."
  },

  // ================= Evidence & Analyzing =================
  {
    "id": "h31", "topic": "Evidence",
    "question": "When you analyze a historic account, what should you use to support your answer?",
    "answer": "Evidence",
    "distractors": ["A guess", "Your favorite color", "The map's title"],
    "explanation": "When you analyze history, back up your answer with evidence — facts and details from the source."
  },
  {
    "id": "h32", "topic": "Evidence",
    "question": "What does 'evidence' mean?",
    "answer": "Facts or details that support an idea",
    "distractors": ["A person's point of view", "A natural landscape", "A year on a timeline"],
    "explanation": "Evidence is the facts or details you use to support and prove an idea."
  },
  {
    "id": "h33", "topic": "Evidence",
    "question": "What does it mean to 'analyze' a historic account?",
    "answer": "To look at it closely and think about what it means",
    "distractors": ["To copy it word for word", "To ignore it", "To color it in"],
    "explanation": "To analyze means to look closely and think carefully about what a source means, using evidence."
  },

  // ================= Fill-in-the-blank (drag or tap) =================
  {
    "id": "b01", "topic": "Timeline & Dates", "type": "blank",
    "question": "The years before year one are labeled {blank}.",
    "answer": "BCE",
    "distractors": ["CE", "zero"],
    "explanation": "BCE (Before Common Era) is all the years before year one, on the left of the timeline."
  },
  {
    "id": "b02", "topic": "Timeline & Dates", "type": "blank",
    "question": "On a timeline, BCE years go to the {blank} of zero.",
    "answer": "left",
    "distractors": ["right", "top"],
    "explanation": "BCE years go to the left of zero. CE years go to the right."
  },
  {
    "id": "b03", "topic": "Sources", "type": "blank",
    "question": "A {blank} source is a firsthand account from someone who was there.",
    "answer": "primary",
    "distractors": ["secondary", "made-up"],
    "explanation": "A primary source is firsthand — it comes from someone who was actually there."
  },
  {
    "id": "b04", "topic": "Sources", "type": "blank",
    "question": "A {blank} source is made by someone who was NOT there.",
    "answer": "secondary",
    "distractors": ["primary", "firsthand"],
    "explanation": "A secondary source is secondhand — made by people who were not there, like a textbook."
  },
  {
    "id": "b05", "topic": "Sources", "type": "blank",
    "question": "A photograph taken at an event is a {blank} source.",
    "answer": "primary",
    "distractors": ["secondary", "fake"],
    "explanation": "A photo taken at the event is firsthand, so it is a primary source."
  },
  {
    "id": "b06", "topic": "Perspectives", "type": "blank",
    "question": "A person's point of view is called their {blank}.",
    "answer": "perspective",
    "distractors": ["evidence", "timeline"],
    "explanation": "A perspective is a person's point of view — the way they see something."
  },
  {
    "id": "b07", "topic": "Geography", "type": "blank",
    "question": "A mountain is a {blank} feature.",
    "answer": "physical",
    "distractors": ["human", "made"],
    "explanation": "A mountain is natural, so it is a physical feature."
  },
  {
    "id": "b08", "topic": "Geography", "type": "blank",
    "question": "Physical features are the natural {blank} of an area.",
    "answer": "landscape",
    "distractors": ["buildings", "rules"],
    "explanation": "Physical features are the natural landscape of an area, like mountains and rivers."
  },
  {
    "id": "b09", "topic": "Maps", "type": "blank",
    "question": "The {blank} of a map explains what the symbols and colors mean.",
    "answer": "legend",
    "distractors": ["title", "border"],
    "explanation": "The legend (also called the key) explains the map's symbols and colors."
  },
  {
    "id": "b10", "topic": "Maps", "type": "blank",
    "question": "The {blank} tells you what a map is about.",
    "answer": "title",
    "distractors": ["legend", "scale"],
    "explanation": "The title tells you the subject of the map — what it is about."
  },
  {
    "id": "b11", "topic": "Evidence", "type": "blank",
    "question": "Facts and details that support an idea are called {blank}.",
    "answer": "evidence",
    "distractors": ["perspective", "opinions"],
    "explanation": "Evidence is the facts and details you use to support and prove an idea."
  }

];

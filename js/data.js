/* ==================================================================
   THE QUESTIONS  —  edit freely, everything else adapts.
   ------------------------------------------------------------------
   type: 'single'  one answer
         'multi'   several answers (set max)
         'text'    free typing
   other:true      adds a "Something else…" option with a text box
   showIf          only asked if the function returns true
   short           the label used on the finished card

   NOTE: question order and ids are baked into share links. Adding a
   question at the end is safe; reordering or removing one will break
   links people have already sent.
   ================================================================== */

export const SECTIONS = {
  comms:  { name:"Talking",           blurb:"How you like to be reached, and what lands when things are hard." },
  food:   { name:"Food & drink",      blurb:"The easiest kind of love language to act on." },
  little: { name:"The little things", blurb:"What makes you feel noticed." },
  love:   { name:"Love languages",    blurb:"Two that fit you best. There's a ? on each if you want it explained." }
};

export const QUESTIONS = [
  { id:"rough", section:"comms", short:"On a rough day",
    q:"When you're having a rough day, what actually helps?",
    type:"single", other:true, options:[
      "A message just checking in",
      "A phone call or a voice note",
      "Space, until I'm ready to talk",
      "Someone turning up in person"
    ]},

  { id:"deliver", section:"comms", short:"Encouragement lands best",
    q:"How do you like encouragement delivered?",
    type:"single", other:true, options:[
      "Said plainly and directly",
      "A long, thought-out message",
      "Small check-ins, often",
      "Said out loud, in front of people"
    ]},

  { id:"reach", section:"comms", short:"Best way to reach me",
    q:"What's the best way to reach you?",
    type:"single", other:true, options:[
      "WhatsApp message",
      "Voice note",
      "Phone call",
      "Face to face"
    ]},

  { id:"comfort", section:"food", short:"Comfort food",
    q:"Comfort food that never misses?",
    type:"single", other:true, options:[
      "A proper home-cooked meal",
      "Takeaway — no cooking involved",
      "Pastries and baked things",
      "Chocolate. Obviously."
    ]},

  { id:"drink", section:"food", short:"Drink of choice",
    q:"Drink of choice?",
    type:"single", other:true, options:[
      "Tea",
      "Coffee",
      "Something cold and sweet",
      "Water — I'm boring"
    ]},

  { id:"treat", section:"food", short:"Surprise me with",
    q:"If someone surprised you with a treat, what should it be?",
    type:"single", other:true, options:[
      "My usual coffee order",
      "Snacks for the week",
      "A bar of something good",
      "A meal out"
    ]},

  { id:"seen", section:"little", short:"Makes me feel seen",
    q:"What makes you feel most seen?",
    type:"single", other:true, options:[
      "Someone remembering a small detail",
      "Being asked how a specific thing went",
      "Being included without having to ask",
      "Being thanked by name for something I did"
    ]},

  { id:"refill", section:"little", short:"How I refill",
    q:"How do you refill when you're running on empty?",
    type:"single", other:true, options:[
      "Alone and quiet",
      "With one or two close people",
      "Out, busy, around people",
      "Sleep. Genuinely."
    ]},

  { id:"lift", section:"little", short:"Lifts me every time",
    q:"What lifts you when nothing else is working?",
    type:"single", other:true, options:[
      "Worship music",
      "A verse someone sends me",
      "A long walk",
      "Laughing with people who know me"
    ]},

  { id:"verse", section:"little", short:"A line that always lands",
    q:"A verse, line or lyric that always lands for you",
    type:"text", optional:true,
    hint:"Optional. Whatever you'd want someone to send back to you one day." },

  { id:"person", section:"little", short:"From my person",
    q:"What makes you feel most loved by your person?",
    /* asked of people in a relationship: "Single and dating", "Married" */
    showIf:s => s.ctx===2 || s.ctx===3,
    type:"single", other:true, options:[
      "Being told, out loud",
      "Time together with no phones",
      "Them doing something practical for me",
      "Being held"
    ]},

  { id:"friend", section:"little", short:"A good friend",
    q:"What does a good friend do that means the most?",
    /* the other half: "Campus", "Single and not dating", or unanswered */
    showIf:s => s.ctx===0 || s.ctx===1 || s.ctx==null,
    type:"single", other:true, options:[
      "Checks in without being prompted",
      "Shows up when it matters",
      "Tells me the truth, kindly",
      "Just sits with me"
    ]},

  { id:"love", section:"love", short:"Love languages",
    q:"Which two fit you best?",
    type:"multi", max:2, options:[
      "Words of affirmation",
      "Quality time",
      "Acts of service",
      "Gifts",
      "Physical touch"
    ],
    notes:[
      "Being told, in words, what someone sees in you.",
      "Undivided attention. Time where you're the only thing on.",
      "Someone doing a practical thing so you don't have to.",
      "A small tangible sign that you were thought about.",
      "A hug, a hand on the shoulder, sitting close."
    ]}
];

/* CONTEXTS is positional: state.ctx stores the INDEX, not the label, and the
   showIf functions above test that index. Reorder these and you change which
   question people get — and what old share links decode to. */
export const CONTEXTS = ["Campus","Single and not dating","Single and dating","Married"];
export const AGES = ["Under 18","18–24","25–34","35–44","45–54","55+","Rather not say"];

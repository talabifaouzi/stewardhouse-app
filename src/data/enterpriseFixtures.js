export const INST_PROFILES = [
  {
    id: "athletics",
    sector: "Athletics",
    name: "Cooper State University",
    dept: "Athletic Department",
    contract: "Season Residency — Aug 2026 to May 2027",
    facilitator: "Morgan Walker",
    tier: "Revenue Sports Package",
    annual: "$85,000",
    endowment: "$8,500/yr", // annual contribution into the department's endowment, NOT total endowment size
  },
];

export const athletes = [
  {id:1, name:"Marcus Thompson", sport:"Basketball", year:"Junior", position:"Guard", gpsCompleted:true, gpsDate:"Sep 20", lessons:5, gifts:3, lastActive:"2d ago", status:"active", joinDate:"Aug 28", badge:"The Quiet Builder", certified:false, certDate:null},
  {id:2, name:"Aaliyah Williams", sport:"Track & Field", year:"Senior", position:"400m", gpsCompleted:true, gpsDate:"Sep 15", lessons:7, gifts:5, lastActive:"1d ago", status:"active", joinDate:"Aug 25", badge:"The Amplifier", certified:true, certDate:"Nov 2, 2026"},
  {id:3, name:"Devon Carter", sport:"Football", year:"Sophomore", position:"WR", gpsCompleted:true, gpsDate:"Oct 1", lessons:3, gifts:1, lastActive:"5d ago", status:"active", joinDate:"Aug 28", badge:"The Builder", certified:false, certDate:null},
  {id:4, name:"Jasmine Okafor", sport:"Soccer", year:"Junior", position:"MF", gpsCompleted:true, gpsDate:"Sep 22", lessons:4, gifts:2, lastActive:"3d ago", status:"active", joinDate:"Aug 30", badge:"The Connector", certified:false, certDate:null},
  {id:5, name:"Tyler Brooks", sport:"Basketball", year:"Freshman", position:"F", gpsCompleted:false, gpsDate:null, lessons:1, gifts:0, lastActive:"14d ago", status:"inactive", joinDate:"Sep 5", badge:null, certified:false, certDate:null},
  {id:6, name:"Keisha Davis", sport:"Volleyball", year:"Senior", position:"Setter", gpsCompleted:true, gpsDate:"Sep 12", lessons:7, gifts:4, lastActive:"1d ago", status:"active", joinDate:"Aug 22", badge:"The Steward", certified:true, certDate:"Oct 28, 2026"},
  {id:7, name:"Andre Mitchell", sport:"Football", year:"Junior", position:"LB", gpsCompleted:true, gpsDate:"Oct 5", lessons:2, gifts:0, lastActive:"21d ago", status:"inactive", joinDate:"Aug 28", badge:"The Learner", certified:false, certDate:null},
  {id:8, name:"Sofia Reyes", sport:"Swimming", year:"Sophomore", position:"Free", gpsCompleted:false, gpsDate:null, lessons:0, gifts:0, lastActive:"Never", status:"invited", joinDate:null, badge:null, certified:false, certDate:null},
  {id:9, name:"Chris Walker", sport:"Baseball", year:"Senior", position:"SS", gpsCompleted:true, gpsDate:"Sep 18", lessons:6, gifts:3, lastActive:"4d ago", status:"active", joinDate:"Aug 26", badge:"The Quiet Builder", certified:false, certDate:null},
  {id:10, name:"Maya Johnson", sport:"Basketball", year:"Freshman", position:"G", gpsCompleted:false, gpsDate:null, lessons:0, gifts:0, lastActive:"Never", status:"invited", joinDate:null, badge:null, certified:false, certDate:null},
  {id:11, name:"Elijah Brown", sport:"Football", year:"Junior", position:"CB", gpsCompleted:true, gpsDate:"Sep 28", lessons:4, gifts:2, lastActive:"7d ago", status:"active", joinDate:"Aug 28", badge:"The Builder", certified:false, certDate:null},
  {id:12, name:"Destiny Clark", sport:"Softball", year:"Senior", position:"P", gpsCompleted:true, gpsDate:"Sep 10", lessons:7, gifts:6, lastActive:"Today", status:"active", joinDate:"Aug 20", badge:"The Steward", certified:true, certDate:"Oct 15, 2026"},
  {id:13, name:"Jordan Lewis", sport:"Football", year:"Senior", position:"QB", gpsCompleted:true, gpsDate:"Sep 8", lessons:7, gifts:4, lastActive:"Today", status:"active", joinDate:"Aug 20", badge:"The Amplifier", certified:true, certDate:"Oct 10, 2026"},
  {id:14, name:"Mia Chang", sport:"Tennis", year:"Junior", position:"Singles", gpsCompleted:true, gpsDate:"Oct 2", lessons:5, gifts:2, lastActive:"6d ago", status:"active", joinDate:"Sep 1", badge:"The Connector", certified:false, certDate:null},
  {id:15, name:"DeSean Harris", sport:"Football", year:"Sophomore", position:"RB", gpsCompleted:true, gpsDate:"Oct 8", lessons:3, gifts:1, lastActive:"3d ago", status:"active", joinDate:"Sep 2", badge:"The Learner", certified:false, certDate:null},
  {id:16, name:"Ava Petrova", sport:"Gymnastics", year:"Freshman", position:"AA", gpsCompleted:false, gpsDate:null, lessons:1, gifts:0, lastActive:"10d ago", status:"inactive", joinDate:"Sep 10", badge:null, certified:false, certDate:null},
];

export const workshops = [
  {id:1, date:"Sep 15, 2026", title:"Kickoff: Building Your GPS", status:"completed", attendees:14, notes:"Strong engagement. 3 participants asked about DAFs."},
  {id:2, date:"Oct 20, 2026", title:"Giving Vehicles & Tax Strategy", status:"completed", attendees:12, notes:"2 absent (scheduling conflict). Recording shared."},
  {id:3, date:"Nov 17, 2026", title:"Vetting Organizations", status:"upcoming", attendees:null, notes:""},
  {id:4, date:"Feb 16, 2027", title:"Year-End Review & Planning", status:"scheduled", attendees:null, notes:""},
  {id:5, date:"Apr 14, 2027", title:"Capstone: Reflection & Next Steps", status:"scheduled", attendees:null, notes:""},
];

export const engagementTimeline = [35, 42, 50, 48, 58, 62, 55, 67, 72, 64, 70, 75]; // 12 weeks of weekly active %

export const exclusions = [
  {id:1, name:"Booster Club Foundation", ein:"04-9912345", reason:"Booster connection", flagged:"Sep 15, 2026"},
  {id:2, name:"Meridian Community Fund", ein:"04-7781234", reason:"Conflict of interest", flagged:"Sep 20, 2026"},
  {id:3, name:"Victory Sports Fund", ein:"04-5534567", reason:"Booster connection", flagged:"Oct 1, 2026"},
];

// Sector-aware terminology (Athletics-only for v1; function shape preserved so M&E can plug in later)
export function T() {
  return {
    p: "athletes", P: "Athletes", s: "athlete", S: "Athlete",
    admin: "Program Admin", comp: "Compliance Officer",
    ws: "workshop", WS: "Workshop", org: "Athletic Department",
    cert: "certified", Cert: "Certified",
    fPrimary: "Sport", fPrimaryPlural: "sports",
    fSecondary: "Position", fTertiary: "Year",
  };
}

// Sector-agnostic field accessor on athlete records
export function F(record) {
  return { primary: record.sport, secondary: record.position, tertiary: record.year };
}

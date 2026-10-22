// Curated historical names / club associations, illustrative rankings. Not live NFL data.
const groups = {
  QB: `Josh Allen|BUF,Jalen Hurts|PHI,Lamar Jackson|BAL,Patrick Mahomes|KC,Joe Burrow|CIN,C.J. Stroud|HOU,Anthony Richardson|IND,Kyler Murray|ARI,Dak Prescott|DAL,Jordan Love|GB,Brock Purdy|SF,Jayden Daniels|WAS,Justin Herbert|LAC,Tua Tagovailoa|MIA,Trevor Lawrence|JAX,Caleb Williams|CHI,Jared Goff|DET,Matthew Stafford|LAR,Kirk Cousins|ATL,Aaron Rodgers|NYJ,Baker Mayfield|TB,Geno Smith|SEA,Deshaun Watson|CLE,Will Levis|TEN,Derek Carr|NO,Bryce Young|CAR,Daniel Jones|NYG,Bo Nix|DEN,Russell Wilson|PIT,Drake Maye|NE,Sam Darnold|MIN,Gardner Minshew|LV,Justin Fields|PIT,Michael Penix Jr.|ATL,Joe Flacco|IND,Spencer Rattler|NO`,
  RB: `Christian McCaffrey|SF,Bijan Robinson|ATL,Breece Hall|NYJ,Saquon Barkley|PHI,Jonathan Taylor|IND,Jahmyr Gibbs|DET,Derrick Henry|BAL,Travis Etienne|JAX,Kyren Williams|LAR,De'Von Achane|MIA,Isiah Pacheco|KC,Josh Jacobs|GB,James Cook|BUF,Rachaad White|TB,Alvin Kamara|NO,Joe Mixon|HOU,Kenneth Walker III|SEA,David Montgomery|DET,James Conner|ARI,Aaron Jones|MIN,Rhamondre Stevenson|NE,Najee Harris|PIT,Zamir White|LV,D'Andre Swift|CHI,Tony Pollard|TEN,Brian Robinson Jr.|WAS,Zack Moss|CIN,Devin Singletary|NYG,Jaylen Warren|PIT,Tyjae Spears|TEN,Austin Ekeler|WAS,Chase Brown|CIN,Nick Chubb|CLE,Jonathon Brooks|CAR,Raheem Mostert|MIA,Blake Corum|LAR,Trey Benson|ARI,Tyler Allgeier|ATL,Zach Charbonnet|SEA,Rico Dowdle|DAL,Chuba Hubbard|CAR,Jaleel McLaughlin|DEN,Jerome Ford|CLE,Antonio Gibson|NE,Ezekiel Elliott|DAL,Gus Edwards|LAC,J.K. Dobbins|LAC,Ty Chandler|MIN,Braelon Allen|NYJ,MarShawn Lloyd|GB,Bucky Irving|TB,Ray Davis|BUF,Kimani Vidal|LAC,Audric Estime|DEN,Justice Hill|BAL,Khalil Herbert|CHI,Roschon Johnson|CHI,Dameon Pierce|HOU,Tank Bigsby|JAX,Kendre Miller|NO,Jamaal Williams|NO,Samaje Perine|KC,D'Onta Foreman|CLE,Alexander Mattison|LV,Isaac Guerendo|SF,Kenneth Gainwell|PHI,Will Shipley|PHI,Emari Demercado|ARI,Eric Gray|NYG,Sean Tucker|TB,Israel Abanikanda|NYJ,Deuce Vaughn|DAL,Javonte Williams|DEN,Keaton Mitchell|BAL`,
  WR: `CeeDee Lamb|DAL,Tyreek Hill|MIA,Ja'Marr Chase|CIN,Justin Jefferson|MIN,Amon-Ra St. Brown|DET,A.J. Brown|PHI,Puka Nacua|LAR,Garrett Wilson|NYJ,Marvin Harrison Jr.|ARI,Drake London|ATL,Davante Adams|LV,Chris Olave|NO,Brandon Aiyuk|SF,Deebo Samuel|SF,Nico Collins|HOU,Mike Evans|TB,DK Metcalf|SEA,Cooper Kupp|LAR,DeVonta Smith|PHI,Jaylen Waddle|MIA,Malik Nabers|NYG,Michael Pittman Jr.|IND,Stefon Diggs|HOU,DJ Moore|CHI,Tank Dell|HOU,Terry McLaurin|WAS,Tee Higgins|CIN,Zay Flowers|BAL,George Pickens|PIT,Amari Cooper|CLE,Christian Kirk|JAX,Calvin Ridley|TEN,Chris Godwin|TB,Rashee Rice|KC,Jayden Reed|GB,Jordan Addison|MIN,Xavier Worthy|KC,Rome Odunze|CHI,Jaxon Smith-Njigba|SEA,Brian Thomas Jr.|JAX,Ladd McConkey|LAC,DeAndre Hopkins|TEN,Courtland Sutton|DEN,Diontae Johnson|CAR,Jameson Williams|DET,Christian Watson|GB,Keon Coleman|BUF,Hollywood Brown|KC,Tyler Lockett|SEA,Brandin Cooks|DAL,Jakobi Meyers|LV,Josh Palmer|LAC,Khalil Shakir|BUF,Curtis Samuel|BUF,Jerry Jeudy|CLE,Adam Thielen|CAR,Darnell Mooney|ATL,Rashid Shaheed|NO,Wan'Dale Robinson|NYG,Josh Downs|IND,Adonai Mitchell|IND,Demario Douglas|NE,Ja'Lynn Polk|NE,Roman Wilson|PIT,Michael Wilson|ARI,Jahan Dotson|PHI,Quentin Johnston|LAC,Demarcus Robinson|LAR,Andrei Iosivas|CIN,Jermaine Burton|CIN,Jalen McMillan|TB,Jalen Tolbert|DAL,Noah Brown|WAS,Luke McCaffrey|WAS,Greg Dortch|ARI,Devontez Walker|BAL,Ricky Pearsall|SF,Jacob Cowing|SF,Troy Franklin|DEN,Marvin Mims Jr.|DEN,Devaughn Vele|DEN,Xavier Legette|CAR,Jonathan Mingo|CAR,Elijah Moore|CLE,Cedric Tillman|CLE,Malachi Corley|NYJ,Allen Lazard|NYJ,Mike Williams|NYJ,Alec Pierce|IND,Nick Westbrook-Ikhine|TEN,Tyler Boyd|TEN,K.J. Osborn|NE,Kendrick Bourne|NE,JuJu Smith-Schuster|KC,Justin Watson|KC,Bo Melton|GB,Dontayvion Wicks|GB,Kalif Raymond|DET,Josh Reynolds|DEN,Tim Patrick|DET`,
  TE: `Sam LaPorta|DET,Travis Kelce|KC,Trey McBride|ARI,Mark Andrews|BAL,Dalton Kincaid|BUF,George Kittle|SF,Kyle Pitts|ATL,Evan Engram|JAX,Jake Ferguson|DAL,David Njoku|CLE,Brock Bowers|LV,Dallas Goedert|PHI,Dalton Schultz|HOU,Pat Freiermuth|PIT,Cole Kmet|CHI,T.J. Hockenson|MIN,Luke Musgrave|GB,Hunter Henry|NE,Taysom Hill|NO,Tyler Conklin|NYJ,Chigoziem Okonkwo|TEN,Noah Fant|SEA,Jonnu Smith|MIA,Cade Otton|TB,Zach Ertz|WAS,Isaiah Likely|BAL,Ben Sinnott|WAS,Juwan Johnson|NO,Gerald Everett|CHI,Colby Parkinson|LAR,Hayden Hurst|LAC,Greg Dulcich|DEN,Dawson Knox|BUF,Tucker Kraft|GB,Michael Mayer|LV,Daniel Bellinger|NYG,Theo Johnson|NYG,Ja'Tavion Sanders|CAR,Jelani Woods|IND,Noah Gray|KC`,
  K: `Justin Tucker|BAL,Harrison Butker|KC,Brandon Aubrey|DAL,Jake Elliott|PHI,Tyler Bass|BUF,Ka'imi Fairbairn|HOU,Jake Moody|SF,Evan McPherson|CIN,Jason Sanders|MIA,Younghoe Koo|ATL,Chris Boswell|PIT,Jason Myers|SEA,Cameron Dicker|LAC,Matt Gay|IND,Cairo Santos|CHI,Daniel Carlson|LV,Greg Zuerlein|NYJ,Chase McLaughlin|TB,Blake Grupe|NO,Matt Prater|ARI,Nick Folk|TEN,Will Reichard|MIN,Joshua Karty|LAR,Wil Lutz|DEN,Eddy Pineiro|CAR,Dustin Hopkins|CLE,Brayden Narveson|GB,Greg Joseph|NYG,Joey Slye|NE,Austin Seibert|WAS,Cam Little|JAX,Jake Bates|DET`,
  DEF: `49ers|SF,Ravens|BAL,Cowboys|DAL,Jets|NYJ,Browns|CLE,Steelers|PIT,Chiefs|KC,Bills|BUF,Texans|HOU,Eagles|PHI,Dolphins|MIA,Lions|DET,Bears|CHI,Saints|NO,Packers|GB,Bengals|CIN,Colts|IND,Jaguars|JAX,Seahawks|SEA,Raiders|LV,Vikings|MIN,Buccaneers|TB,Broncos|DEN,Chargers|LAC,Rams|LAR,Falcons|ATL,Patriots|NE,Titans|TEN,Giants|NYG,Commanders|WAS,Cardinals|ARI,Panthers|CAR`,
};
groups.QB +=
  ",Jacoby Brissett|NE,Andy Dalton|CAR,Tyrod Taylor|NYJ,Marcus Mariota|WAS,Jimmy Garoppolo|LAR,Carson Wentz|KC,Kenny Pickett|PHI,Drew Lock|NYG,Sam Howell|SEA,Joshua Dobbs|SF,Aidan O’Connell|LV,Jameis Winston|CLE,Mitchell Trubisky|BUF,Mason Rudolph|TEN,Taylor Heinicke|LAC,Mac Jones|JAX";
groups.RB +=
  ",Cam Akers|MIN,Dalvin Cook|DAL,Kareem Hunt|KC,Leonard Fournette|BUF,Latavius Murray|BUF,Joshua Kelley|LAC,Chris Rodriguez Jr.|WAS,Pierre Strong Jr.|CLE,Dare Ogunbowale|HOU,Ameer Abdullah|LV,Ty Johnson|BUF,DeeJay Dallas|ARI,Clyde Edwards-Helaire|KC,Jeff Wilson Jr.|MIA,Salvon Ahmed|MIA";
groups.WR +=
  ",Robert Woods|HOU,Nelson Agholor|BAL,Van Jefferson|PIT,Quez Watkins|PIT,Allen Robinson|DET,David Bell|CLE,Donovan Peoples-Jones|DET,Richie James|KC,Isaiah McKenzie|NYG,Parris Campbell|PHI,Sterling Shepard|TB,Julio Jones|PHI,Michael Gallup|DAL,Russell Gage|TB,Robbie Chosen|MIA,Chase Claypool|BUF";
const profiles = {
  QB: [94, 1.7, 360, 5],
  RB: [100, 1.15, 310, 3.5],
  WR: [99, 0.88, 305, 2.5],
  TE: [88, 1.55, 230, 3.7],
  K: [39, 0.7, 150, 1.6],
  DEF: [40, 0.72, 145, 1.7],
};
export const positions = Object.keys(groups);
export const players = Object.entries(groups)
  .flatMap(([position, list]) =>
    list.split(",").map((entry, i) => {
      const [name, team] = entry.split("|");
      const [base, decay, points, pd] = profiles[position];
      return {
        id: `${position.toLowerCase()}-${i + 1}`,
        name,
        team,
        position,
        value: Math.max(5, +(base - i * decay).toFixed(2)),
        points: Math.max(20, Math.round(points - i * pd)),
      };
    }),
  )
  .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))
  .map((p, i) => ({ ...p, rank: i + 1 }));

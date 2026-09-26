import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

/** Living in a digital world: networks, security and AI literacy (grades 8–9). */
export const COMPUTER_SCIENCE_DIGITAL: BiLesson[] = [
  {
    group: "networks",
    subject: "computer_science",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /network|internet|ip.address|router|packet|dns|ქსელ|ინტერნეტ|როუტერ|პაკეტ/i,
    title: l("How the Internet Works: Networks, Addresses and Packets", "როგორ მუშაობს ინტერნეტი: ქსელები, მისამართები და პაკეტები"),
    topic: l("Computer networks", "კომპიუტერული ქსელები"),
    objective: l(
      "Students explain what happens when a web page loads: addresses, names, packets and protocols, and calculate simple download times.",
      "მოსწავლეები ხსნიან, რა ხდება ვებგვერდის ჩატვირთვისას: მისამართები, სახელები, პაკეტები და პროტოკოლები, და ითვლიან ჩამოტვირთვის მარტივ დროს.",
    ),
    objectives: [
      l("Describe a local network and the internet as a network of networks.", "აღწეროს ლოკალური ქსელი და ინტერნეტი, როგორც ქსელების ქსელი."),
      l("Recognise a valid IPv4 address and explain what DNS does.", "ამოიცნოს სწორი IPv4-მისამართი და ახსნას, რას აკეთებს DNS."),
      l("Explain why data is split into packets.", "ახსნას, რატომ იყოფა მონაცემები პაკეტებად."),
      l("Convert between bits and bytes and estimate a download time.", "გადაიყვანოს ბიტები ბაიტებში და პირიქით, და შეაფასოს ჩამოტვირთვის დრო."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("One click, many machines", "ერთი დაწკაპუნება, ბევრი მანქანა"),
        minutes: 5,
        body: l(
          `You type a web address and, less than a second later, the page appears. Behind that second: your computer, the school's Wi-Fi, a router, cables under the street, maybe a glass fibre under the Black Sea, and a server in another country.

Even this lesson runs on a network: every student computer in the room talks to the Future Classroom server through the school network.`,
          `ვებმისამართს აკრეფ და წამზე ნაკლებ დროში გვერდი იხსნება. ამ ერთი წამის მიღმაა: შენი კომპიუტერი, სკოლის Wi-Fi, როუტერი, ქუჩის ქვეშ გაყვანილი კაბელები, შესაძლოა შავი ზღვის ფსკერზე გაყვანილი ოპტიკური ბოჭკოც და სერვერი სხვა ქვეყანაში.

ეს გაკვეთილიც ქსელში მიმდინარეობს: კლასის ყველა მოსწავლის კომპიუტერი სკოლის ქსელით უკავშირდება „მომავლის საკლასო ოთახის“ სერვერს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Networks and addresses", "ქსელები და მისამართები"),
        minutes: 12,
        body: l(
          `• A network is two or more devices connected so they can exchange data.
• A local network (LAN) covers one building, like the school. A router connects it to other networks.
• The internet is a network of networks: millions of local networks connected by routers.

Every device on a network has an IP address, like a postal address. An IPv4 address is four numbers from 0 to 255 separated by dots, for example 192.168.1.10. Addresses beginning 192.168. or 10. are private: they work only inside a local network.

People remember names, computers use numbers. DNS (the Domain Name System) is the internet's phone book: it turns a name such as example.org into the IP address of the server.`,
          `• ქსელი ორი ან მეტი მოწყობილობაა, რომლებიც ისეა დაკავშირებული, რომ მონაცემები გაცვალონ.
• ლოკალური ქსელი (LAN) ერთ შენობას მოიცავს, მაგალითად, სკოლას. როუტერი (მარშრუტიზატორი) მას სხვა ქსელებთან აკავშირებს.
• ინტერნეტი ქსელების ქსელია: როუტერებით დაკავშირებული მილიონობით ლოკალური ქსელი.

ქსელში ყველა მოწყობილობას აქვს IP-მისამართი, საფოსტო მისამართის მსგავსად. IPv4-მისამართი წერტილებით გამოყოფილი ოთხი რიცხვია 0-დან 255-მდე, მაგალითად, 192.168.1.10. 192.168.-ით ან 10.-ით დაწყებული მისამართები კერძოა: მხოლოდ ლოკალური ქსელის შიგნით მუშაობს.

ადამიანებს სახელები ახსოვთ, კომპიუტერები კი რიცხვებს იყენებენ. DNS (დომენური სახელების სისტემა) ინტერნეტის სატელეფონო წიგნაკია: სახელს, მაგალითად example.org-ს, სერვერის IP-მისამართად აქცევს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Packets, protocols and speed", "პაკეტები, პროტოკოლები და სიჩქარე"),
        minutes: 10,
        body: l(
          `Data is not sent in one piece. It is cut into small packets (often up to about 1500 bytes each). Each packet carries the sender's and receiver's addresses and a number, travels on its own — sometimes by different routes — and the receiver puts them back in order. If one packet is lost, only that packet is sent again, and many users can share the same cables at once.

Protocols are the agreed rules: TCP/IP delivers the packets, HTTP carries web pages, and HTTPS does the same with encryption, so nobody in between can read or change the page.

Speed is measured in bits per second. 1 byte = 8 bits.
Example: a 20 MB (megabyte) video over a 40 Mbit/s (megabit per second) connection:
20 MB = 20 · 8 = 160 Mbit → 160 ÷ 40 = 4 s (in reality a little longer).`,
          `მონაცემები ერთ ნაწილად არ იგზავნება. ისინი მცირე პაკეტებად იჭრება (ხშირად თითოეული დაახლოებით 1500 ბაიტამდეა). ყველა პაკეტს აქვს გამგზავნისა და მიმღების მისამართი და რიგითი ნომერი, დამოუკიდებლად მოგზაურობს — ზოგჯერ სხვადასხვა გზით — მიმღები კი მათ ისევ რიგზე აწყობს. თუ ერთი პაკეტი დაიკარგა, მხოლოდ ის იგზავნება თავიდან, ერთსა და იმავე კაბელს კი ერთდროულად ბევრი მომხმარებელი იყენებს.

პროტოკოლები შეთანხმებული წესებია: TCP/IP პაკეტებს აწვდის, HTTP ვებგვერდებს გადასცემს, HTTPS კი იმავეს დაშიფრულად აკეთებს, რომ შუაში ვერავინ წაიკითხოს ან შეცვალოს გვერდი.

სიჩქარე ბიტებში წამში იზომება. 1 ბაიტი = 8 ბიტი.
მაგალითი: 20 მბ (მეგაბაიტი) ვიდეო 40 მბიტ/წმ (მეგაბიტი წამში) კავშირით:
20 მბ = 20 · 8 = 160 მბიტ → 160 ÷ 40 = 4 წმ (სინამდვილეში ცოტა მეტი).`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 13,
        body: l(
          `Complete the activities. Then act out packet switching: split a short message into four numbered paper "packets", pass them to the receiver along different rows of desks, and let the receiver rebuild the message.`,
          `შეასრულე აქტივობები. შემდეგ პაკეტების გადაცემა ითამაშეთ: მოკლე შეტყობინება ოთხ დანომრილ ქაღალდის „პაკეტად“ დაჭერით, მიმღებს მერხების სხვადასხვა რიგით გადაეცით და მიმღებმა შეტყობინება თავიდან ააწყოს.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• The internet is a network of networks joined by routers.
• IPv4 address: four numbers 0–255. DNS turns names into addresses.
• Data travels in numbered packets; lost packets are resent.
• HTTPS encrypts. 1 byte = 8 bits; speeds are in bits per second.`,
          `• ინტერნეტი როუტერებით დაკავშირებული ქსელების ქსელია.
• IPv4-მისამართი: ოთხი რიცხვი 0–255. DNS სახელებს მისამართებად აქცევს.
• მონაცემები დანომრილი პაკეტებით მოგზაურობს; დაკარგული პაკეტები თავიდან იგზავნება.
• HTTPS შიფრავს. 1 ბაიტი = 8 ბიტი; სიჩქარე ბიტებში წამში იზომება.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("A valid address", "სწორი მისამართი"),
        prompt: l("Which of these is a valid IPv4 address?", "რომელია ამათგან სწორი IPv4-მისამართი?"),
        options: ["192.168.1.25", "192.168.1.256", "192.168.1", "www.school.ge"],
        correct: 0,
        hints: [l("An IPv4 address has exactly four numbers separated by dots.", "IPv4-მისამართს ზუსტად ოთხი, წერტილებით გამოყოფილი რიცხვი აქვს."), l("Each of the four numbers must be between 0 and 255.", "ოთხივე რიცხვი 0-სა და 255-ს შორის უნდა იყოს.")],
        explanation: l("192.168.1.256 has a number above 255, 192.168.1 has only three parts, and www.school.ge is a name, not an address.", "192.168.1.256-ში ერთი რიცხვი 255-ზე მეტია, 192.168.1-ს მხოლოდ სამი ნაწილი აქვს, www.school.ge კი სახელია და არა მისამართი."),
      },
      {
        type: "mc",
        title: l("What DNS does", "რას აკეთებს DNS"),
        prompt: l("What does DNS do?", "რას აკეთებს DNS?"),
        options: [
          l("Turns names like example.org into IP addresses", "სახელებს, მაგალითად example.org-ს, IP-მისამართებად აქცევს"),
          l("Encrypts web pages", "ვებგვერდებს შიფრავს"),
          l("Makes the connection faster", "კავშირს აჩქარებს"),
          l("Blocks viruses", "ვირუსებს ბლოკავს"),
        ],
        correct: 0,
        hints: [l("DNS is sometimes called the internet's phone book.", "DNS-ს ზოგჯერ ინტერნეტის სატელეფონო წიგნაკს უწოდებენ."), l("People remember names; what do computers need to find a server?", "ადამიანებს სახელები ახსოვთ; რა სჭირდება კომპიუტერს სერვერის საპოვნელად?")],
        explanation: l("DNS looks up the IP address that belongs to a name.", "DNS პოულობს სახელის შესაბამის IP-მისამართს."),
      },
      {
        type: "exercise",
        title: l("Download time", "ჩამოტვირთვის დრო"),
        prompt: l(
          "A video file is 20 MB (megabytes). The connection speed is 40 Mbit/s (megabits per second). Ignoring delays, how many seconds does the download take?",
          "ვიდეოფაილის ზომაა 20 მბ (მეგაბაიტი). კავშირის სიჩქარეა 40 მბიტ/წმ (მეგაბიტი წამში). შეფერხებების გარეშე რამდენ წამს გასტანს ჩამოტვირთვა?",
        ),
        accepted: ["4"],
        hints: [l("File sizes are in bytes, speeds in bits. 1 byte = 8 bits.", "ფაილის ზომა ბაიტებშია, სიჩქარე — ბიტებში. 1 ბაიტი = 8 ბიტი."), l("20 MB = 160 Mbit. Now divide by the speed.", "20 მბ = 160 მბიტ. ახლა გაყავი სიჩქარეზე.")],
        solution: l("20 · 8 = 160 Mbit; 160 ÷ 40 = 4 s", "20 · 8 = 160 მბიტ; 160 ÷ 40 = 4 წმ"),
      },
      {
        type: "exercise",
        title: l("Counting packets", "პაკეტების დათვლა"),
        prompt: l("A message of 7000 bytes is split into packets carrying at most 1500 bytes of data each. How many packets are needed?", "7000 ბაიტის შეტყობინება იყოფა პაკეტებად, რომელთაგან თითოეულს მაქსიმუმ 1500 ბაიტი მონაცემი გადააქვს. რამდენი პაკეტია საჭირო?"),
        accepted: ["5"],
        hints: [l("Divide the message size by the packet size.", "შეტყობინების ზომა პაკეტის ზომაზე გაყავი."), l("7000 ÷ 1500 ≈ 4.7 — can you send part of a packet, or do you need a whole extra one?", "7000 ÷ 1500 ≈ 4,7 — შეიძლება პაკეტის ნაწილის გაგზავნა, თუ კიდევ ერთი მთელი პაკეტი გჭირდება?")],
        solution: l("4 full packets carry 6000 bytes; the last 1000 bytes need a 5th packet.", "4 სრულ პაკეტს 6000 ბაიტი გადააქვს; დარჩენილ 1000 ბაიტს მე-5 პაკეტი სჭირდება."),
      },
      {
        type: "mc",
        title: l("Why packets?", "რატომ პაკეტები?"),
        prompt: l("Why is data split into packets instead of being sent in one piece?", "რატომ იყოფა მონაცემები პაკეტებად და არ იგზავნება ერთ ნაწილად?"),
        options: [
          l("Many users can share the lines, and a lost piece can be resent on its own", "ხაზებს ბევრი მომხმარებელი იყენებს ერთად, დაკარგული ნაწილი კი ცალკე იგზავნება თავიდან"),
          l("Small packets are encrypted automatically", "პატარა პაკეტები ავტომატურად იშიფრება"),
          l("Computers cannot store big files", "კომპიუტერებს დიდი ფაილების შენახვა არ შეუძლია"),
          l("Packets always arrive in order", "პაკეტები ყოველთვის რიგით ჩადის"),
        ],
        correct: 0,
        hints: [l("Imagine one huge file blocking a cable for everyone else.", "წარმოიდგინე, რომ ერთი უზარმაზარი ფაილი კაბელს ყველასთვის იკავებს."), l("What happens if something goes wrong halfway through a very long transfer?", "რა ხდება, თუ ძალიან გრძელი გადაცემის შუაში რამე შეფერხდა?")],
        explanation: l("Packets let many transfers share the network, and only lost packets are resent.", "პაკეტები ქსელის ერთდროულად ბევრ გადაცემას უნაწილებს და თავიდან მხოლოდ დაკარგული პაკეტები იგზავნება."),
      },
      {
        type: "discussion",
        prompt: l("Our classroom server has a private address like 192.168.1.10. Why can a phone using mobile data not open it?", "ჩვენი საკლასო სერვერის მისამართი კერძოა, მაგალითად, 192.168.1.10. რატომ ვერ გახსნის მას მობილური ინტერნეტით ჩართული ტელეფონი?"),
      },
      { type: "exit", prompt: l("In three steps, describe what happens between typing a web address and seeing the page.", "სამ ნაბიჯად აღწერე, რა ხდება ვებმისამართის აკრეფიდან გვერდის გამოჩენამდე.") },
    ],
    discussion: [
      l("What would happen if the DNS servers stopped working, but all cables still worked?", "რა მოხდებოდა, DNS-სერვერები რომ გაჩერებულიყო, კაბელები კი ისევ მუშაობდეს?"),
      l("Why is HTTPS important when you sign in to a website?", "რატომ არის HTTPS მნიშვნელოვანი ვებსაიტზე შესვლისას?"),
    ],
    assessment: [
      l("Correct identification of valid and invalid IPv4 addresses.", "სწორი და არასწორი IPv4-მისამართების სწორად ამოცნობა."),
      l("A download-time calculation with the bits–bytes conversion.", "ჩამოტვირთვის დროის გამოთვლა ბიტებისა და ბაიტების გადაყვანით."),
    ],
    homework: [
      l("Find out the speed of your home or phone connection (ask an adult or look at the plan). How long would a 1 GB (1000 MB) game update take?", "გაიგე შენი სახლის ან ტელეფონის ინტერნეტის სიჩქარე (ჰკითხე უფროსს ან ნახე ტარიფი). რამდენ ხანს გასტანდა 1 გბ (1000 მბ) ზომის თამაშის განახლება?"),
      l("Draw your home or school network: which devices connect to the router?", "დახაზე შენი სახლის ან სკოლის ქსელი: რომელი მოწყობილობები უკავშირდება როუტერს?"),
    ],
    teacherNotes: l(
      "The packet role-play works best with a message that makes no sense out of order. Students often mix up MB and Mbit; write both units on the board. The school's own classroom server is a good example of a private address: show the address on the projector's join screen.",
      "პაკეტების როლური თამაში საუკეთესოდ მუშაობს ისეთი შეტყობინებით, რომელსაც არეული რიგით აზრი არ აქვს. მოსწავლეები ხშირად ურევენ მბ-სა და მბიტ-ს; დაფაზე ორივე ერთეული დაწერეთ. სკოლის საკლასო სერვერი კერძო მისამართის კარგი მაგალითია: აჩვენეთ მისამართი, რომელიც პროექტორზე შესვლის ეკრანზე ჩანს.",
    ),
    quiz: {
      title: l("Networks — check yourself", "ქსელები — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("How many bits are in 3 bytes?", "რამდენი ბიტია 3 ბაიტში?"), answer: 24, explanation: l("3 · 8 = 24", "3 · 8 = 24") },
        { type: "tf", prompt: l("An IPv4 address can contain the number 300.", "IPv4-მისამართი შეიძლება შეიცავდეს რიცხვს 300."), answer: false, explanation: l("Each part is between 0 and 255.", "თითოეული ნაწილი 0-სა და 255-ს შორისაა.") },
        {
          type: "mc",
          prompt: l("Which protocol encrypts a web page on its way to you?", "რომელი პროტოკოლი შიფრავს ვებგვერდს შენამდე მოსვლის გზაზე?"),
          options: ["HTTPS", "HTTP", "DNS", "IPv4"],
          correct: 0,
        },
        { type: "num", prompt: l("10 MB over a 20 Mbit/s connection: download time in seconds?", "10 მბ 20 მბიტ/წმ კავშირით: ჩამოტვირთვის დრო წამებში?"), answer: 4, explanation: l("10 · 8 = 80 Mbit; 80 ÷ 20 = 4 s", "10 · 8 = 80 მბიტ; 80 ÷ 20 = 4 წმ") },
      ],
    },
  },
  {
    group: "cybersecurity",
    subject: "computer_science",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /cyber|security|password|phishing|malware|two.factor|კიბერ|უსაფრთხოებ|პაროლ|ფიშინგ/i,
    title: l("Cybersecurity Basics: Passwords, Phishing and Updates", "კიბერუსაფრთხოების საფუძვლები: პაროლები, ფიშინგი და განახლებები"),
    topic: l("Cybersecurity", "კიბერუსაფრთხოება"),
    objective: l(
      "Students choose strong passwords, recognise phishing messages and know what to do when an account may be compromised.",
      "მოსწავლეები ირჩევენ ძლიერ პაროლებს, ამოიცნობენ ფიშინგის შეტყობინებებს და იციან, რა უნდა გააკეთონ, თუ ანგარიში შესაძლოა გატეხილია.",
    ),
    objectives: [
      l("Explain why long passphrases are stronger than short complicated passwords, using the number of possible combinations.", "შესაძლო კომბინაციების რაოდენობით ახსნას, რატომ არის გრძელი ფრაზა-პაროლი უფრო ძლიერი, ვიდრე მოკლე რთული პაროლი."),
      l("Recognise the warning signs of a phishing message.", "ამოიცნოს ფიშინგის შეტყობინების საგანგაშო ნიშნები."),
      l("Explain what two-factor authentication and software updates protect against.", "ახსნას, რისგან იცავს ორფაქტორიანი ავთენტიკაცია და პროგრამების განახლება."),
      l("Know the first steps when an account may have been stolen.", "იცოდეს პირველი ნაბიჯები, თუ ანგარიში შესაძლოა მოიპარეს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("A message you did not expect", "მოულოდნელი შეტყობინება"),
        minutes: 5,
        body: l(
          `"Your school account will be deleted in 1 hour. Confirm your password here: bit.ly/sch-login"

Would you click? Many people do — that is why this trick is used every day. Attackers rarely "hack" a computer like in films; far more often they simply ask for the password in a convincing way.`,
          `„შენი სასკოლო ანგარიში 1 საათში წაიშლება. პაროლი აქ დაადასტურე: bit.ly/sch-login“

დააწკაპუნებდი? ბევრი აწკაპუნებს — ამიტომაც ეს ხრიკი ყოველდღე გამოიყენება. თავდამსხმელები კომპიუტერს იშვიათად „ტეხენ“ ისე, როგორც ფილმებშია; გაცილებით ხშირად პაროლს უბრალოდ დამაჯერებლად ითხოვენ.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Strong passwords", "ძლიერი პაროლები"),
        minutes: 12,
        body: l(
          `An attacker who guesses passwords tries combinations one after another, often millions per second.
• A 4-digit PIN has 10 · 10 · 10 · 10 = 10 000 possibilities.
• 8 lowercase letters: 26⁸ ≈ 209 billion.
• 4 random ordinary words from a list of 7 000 words: 7 000⁴ ≈ 2 400 trillion — more than ten thousand times as many, and easier to remember.

Length matters most. Rules that work:
• Use a long passphrase (four or more unrelated words), not your name, birthday or "P@ssw0rd".
• Use a different password for every important account: when one website leaks passwords, attackers try them everywhere else.
• Never tell anyone your password — not friends, and not a "teacher" or "support" in a message. Real staff never ask for it.
• A password manager can remember many strong passwords for you.
• Two-factor authentication (2FA): after the password you also enter a code from your phone. A stolen password alone is then not enough.`,
          `თავდამსხმელი, რომელიც პაროლს არჩევს, კომბინაციებს ერთმანეთის მიყოლებით ცდის, ხშირად მილიონობით წამში.
• 4-ნიშნა PIN-კოდს 10 · 10 · 10 · 10 = 10 000 ვარიანტი აქვს.
• 8 პატარა ლათინური ასო: 26⁸ ≈ 209 მილიარდი.
• 7 000 სიტყვიანი სიიდან შემთხვევით არჩეული 4 ჩვეულებრივი სიტყვა: 7 000⁴ ≈ 2 400 ტრილიონი — ათი ათასჯერ მეტი, თანაც უფრო ადვილად დასამახსოვრებელი.

ყველაზე მნიშვნელოვანი სიგრძეა. წესები, რომლებიც მუშაობს:
• გამოიყენე გრძელი ფრაზა-პაროლი (ოთხი ან მეტი ერთმანეთთან დაუკავშირებელი სიტყვა) და არა შენი სახელი, დაბადების დღე ან „P@ssw0rd“.
• ყველა მნიშვნელოვან ანგარიშზე სხვადასხვა პაროლი გამოიყენე: როცა ერთი საიტიდან პაროლები გაჟონავს, თავდამსხმელები მათ ყველგან ცდიან.
• პაროლი არავის უთხრა — არც მეგობარს და არც შეტყობინებაში მოწერილ „მასწავლებელს“ ან „დახმარების სამსახურს“. ნამდვილი თანამშრომლები მას არასდროს ითხოვენ.
• პაროლების მენეჯერს შეუძლია შენთვის ბევრი ძლიერი პაროლი დაიმახსოვროს.
• ორფაქტორიანი ავთენტიკაცია (2FA): პაროლის შემდეგ ტელეფონზე მოსულ კოდსაც შეიყვან. მარტო მოპარული პაროლი მაშინ საკმარისი აღარ არის.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Phishing, updates and what to do", "ფიშინგი, განახლებები და რა უნდა გააკეთო"),
        minutes: 10,
        body: l(
          `Phishing is a fake message that tries to make you click a link, open a file or give away a password or code. Warning signs:
• Hurry or fear: "within 1 hour", "your account will be deleted".
• A sender or link that does not match the real organisation (shortened links, spelling tricks like "sch00l").
• A request for a password, a 2FA code or payment.
• A prize you never entered for.
When in doubt, do not use the link: open the website or app the way you normally do, or ask a teacher or parent.

Updates close security holes that attackers already know about. Install them on your phone and computer.

If something went wrong (you typed your password on a strange page, or your account sends messages you did not write):
1. Change the password at once, from the real website.
2. Tell a teacher or parent.
3. Turn on two-factor authentication.
Never pay anyone who threatens you online; keep the messages and tell an adult.`,
          `ფიშინგი ყალბი შეტყობინებაა, რომელიც ცდილობს, ბმულზე დაგაწკაპუნებინოს, ფაილი გაგახსნევინოს ან პაროლი თუ კოდი გაგამხელინოს. საგანგაშო ნიშნები:
• აჩქარება ან შიში: „1 საათში“, „შენი ანგარიში წაიშლება“.
• გამგზავნი ან ბმული ნამდვილ ორგანიზაციას არ ემთხვევა (შემოკლებული ბმულები, ასოების ხრიკები, მაგალითად „sch00l“).
• პაროლის, 2FA-კოდის ან გადახდის მოთხოვნა.
• პრიზი კონკურსში, რომელშიც არ მიგიღია მონაწილეობა.
თუ ეჭვი გაქვს, ბმული არ გამოიყენო: საიტი ან აპლიკაცია ისე გახსენი, როგორც ყოველთვის, ან ჰკითხე მასწავლებელს ან მშობელს.

განახლებები ხურავს უსაფრთხოების ხარვეზებს, რომლებიც თავდამსხმელებმა უკვე იციან. დააყენე ისინი ტელეფონზეც და კომპიუტერზეც.

თუ რამე არასწორად მოხდა (პაროლი უცნაურ გვერდზე აკრიფე, ან შენი ანგარიშიდან ისეთი შეტყობინებები იგზავნება, რომლებიც შენ არ დაგიწერია):
1. მაშინვე შეცვალე პაროლი ნამდვილ საიტზე.
2. უთხარი მასწავლებელს ან მშობელს.
3. ჩართე ორფაქტორიანი ავთენტიკაცია.
არასდროს გადაუხადო ფული ვინმეს, ვინც ინტერნეტში გემუქრება; შეინახე შეტყობინებები და უთხარი უფროსს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 13,
        body: l(
          `Complete the activities. Then, in pairs, write one realistic phishing message and swap it with another pair: circle every warning sign you can find.`,
          `შეასრულე აქტივობები. შემდეგ წყვილებში დაწერეთ ერთი დამაჯერებელი ფიშინგის შეტყობინება და სხვა წყვილს გაუცვალეთ: შემოხაზეთ ყველა საგანგაშო ნიშანი, რასაც იპოვით.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Long passphrases beat short "complicated" passwords. One password per important account.
• Never share a password or a 2FA code.
• Phishing uses hurry, fear and fake links. Go to the real site yourself.
• Update your devices. If something went wrong: change the password, tell an adult, turn on 2FA.`,
          `• გრძელი ფრაზა-პაროლი მოკლე „რთულ“ პაროლს სჯობს. ყოველ მნიშვნელოვან ანგარიშს — თავისი პაროლი.
• პაროლი და 2FA-კოდი არავის გაუზიარო.
• ფიშინგი აჩქარებას, შიშსა და ყალბ ბმულებს იყენებს. ნამდვილ საიტზე თავად შედი.
• განაახლე მოწყობილობები. თუ რამე მოხდა: შეცვალე პაროლი, უთხარი უფროსს, ჩართე 2FA.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("How many PINs?", "რამდენი PIN-კოდი?"),
        prompt: l("How many different 4-digit PINs are there (digits 0–9, repeats allowed)?", "რამდენი განსხვავებული 4-ნიშნა PIN-კოდი არსებობს (ციფრები 0–9, გამეორება დასაშვებია)?"),
        accepted: ["10000", "10 000", "10^4"],
        hints: [l("How many choices are there for each digit?", "რამდენი ვარიანტია თითოეული ციფრისთვის?"), l("Ten choices for each of four positions: multiply them.", "ოთხივე პოზიციისთვის ათი ვარიანტია: გადაამრავლე.")],
        solution: l("10 · 10 · 10 · 10 = 10 000", "10 · 10 · 10 · 10 = 10 000"),
      },
      {
        type: "exercise",
        title: l("Guessing speed", "გამოცნობის სიჩქარე"),
        prompt: l("A program can try 1000 PINs per second. How many seconds does it need to try every 4-digit PIN?", "პროგრამას წამში 1000 PIN-კოდის ცდა შეუძლია. რამდენი წამი დასჭირდება ყველა 4-ნიშნა PIN-კოდის ცდას?"),
        accepted: ["10"],
        hints: [l("First find how many PINs there are.", "ჯერ გაარკვიე, რამდენი PIN-კოდი არსებობს."), l("Divide the number of PINs by the number tried per second: 10 000 ÷ 1000.", "PIN-კოდების რაოდენობა გაყავი წამში ნაცდელთა რაოდენობაზე: 10 000 ÷ 1000.")],
        solution: l("10 000 ÷ 1000 = 10 s — why phones lock after a few wrong tries.", "10 000 ÷ 1000 = 10 წმ — ამიტომ იბლოკება ტელეფონი რამდენიმე არასწორი ცდის შემდეგ."),
      },
      {
        type: "mc",
        title: l("The strongest password", "ყველაზე ძლიერი პაროლი"),
        prompt: l("Which password is the strongest?", "რომელი პაროლია ყველაზე ძლიერი?"),
        options: ["river-lamp-orbit-bread-47", "P@ssw0rd", "Giorgi2010", "qwerty123"],
        correct: 0,
        hints: [l("Which one is the longest, and which ones could appear in an attacker's list of common passwords?", "რომელია ყველაზე გრძელი და რომლები შეიძლება იყოს თავდამსხმელის ხშირი პაროლების სიაში?"), l("Names, years and keyboard patterns are tried first.", "სახელებს, წლებსა და კლავიატურის ნიმუშებს ყველაზე ადრე ცდიან.")],
        explanation: l("Four unrelated words and a number make a long passphrase that is not in any common list.", "ოთხი დაუკავშირებელი სიტყვა და რიცხვი გრძელ ფრაზა-პაროლს ქმნის, რომელიც არცერთ ხშირ სიაში არ არის."),
      },
      {
        type: "mc",
        title: l("A suspicious message", "საეჭვო შეტყობინება"),
        prompt: l(
          "You get: \"Your school account will be deleted in 1 hour. Confirm your password here: bit.ly/sch-login\". What should you do?",
          "მოგივიდა: „შენი სასკოლო ანგარიში 1 საათში წაიშლება. პაროლი აქ დაადასტურე: bit.ly/sch-login“. რა უნდა გააკეთო?",
        ),
        options: [
          l("Not click, and check with the teacher or on the real school website", "არ დააწკაპუნო და მასწავლებელთან ან სკოლის ნამდვილ საიტზე გადაამოწმო"),
          l("Click quickly so the account is not deleted", "სწრაფად დააწკაპუნო, რომ ანგარიში არ წაიშალოს"),
          l("Reply and ask if it is real", "უპასუხო და ჰკითხო, ნამდვილია თუ არა"),
          l("Forward it to all classmates", "ყველა თანაკლასელს გაუგზავნო"),
        ],
        correct: 0,
        hints: [l("Count the warning signs: time pressure, a shortened link, a request for a password.", "დათვალე საგანგაშო ნიშნები: დროის ზეწოლა, შემოკლებული ბმული, პაროლის მოთხოვნა."), l("Would a real school ever ask for your password in a message?", "ნამდვილი სკოლა შეტყობინებით პაროლს ოდესმე მოგთხოვდა?")],
        explanation: l("Real staff never ask for passwords. Check through the channel you normally use.", "ნამდვილი თანამშრომლები პაროლს არასდროს ითხოვენ. გადაამოწმე ჩვეული გზით."),
      },
      {
        type: "mc",
        title: l("Two-factor authentication", "ორფაქტორიანი ავთენტიკაცია"),
        prompt: l("What does two-factor authentication add to your account?", "რას მატებს ორფაქტორიანი ავთენტიკაცია შენს ანგარიშს?"),
        options: [
          l("A second proof, such as a code on your phone, so a stolen password alone is not enough", "მეორე დადასტურებას, მაგალითად, ტელეფონზე მოსულ კოდს, ასე რომ, მარტო მოპარული პაროლი საკმარისი არ არის"),
          l("A second password that is the same as the first", "მეორე პაროლს, რომელიც პირველის იგივეა"),
          l("Faster sign-in", "უფრო სწრაფ შესვლას"),
          l("Protection against viruses on the computer", "კომპიუტერის ვირუსებისგან დაცვას"),
        ],
        correct: 0,
        hints: [l("\"Factor\" means a separate kind of proof that it is really you.", "„ფაქტორი“ ნიშნავს ცალკე მტკიცებულებას, რომ ეს ნამდვილად შენ ხარ."), l("Something you know (a password) plus something you have (a phone).", "რაც იცი (პაროლი), დამატებული იმაზე, რაც გაქვს (ტელეფონი).")],
        explanation: l("An attacker would need both your password and your phone.", "თავდამსხმელს დასჭირდებოდა როგორც შენი პაროლი, ისე შენი ტელეფონი."),
      },
      {
        type: "discussion",
        prompt: l("Is it ever a good idea to share your password with your best friend? What could go wrong?", "კარგი იდეაა ოდესმე საუკეთესო მეგობრისთვის პაროლის გაზიარება? რა შეიძლება არასწორად წავიდეს?"),
      },
      { type: "exit", prompt: l("Write three warning signs of a phishing message.", "ჩამოწერე ფიშინგის შეტყობინების სამი საგანგაშო ნიშანი.") },
    ],
    discussion: [
      l("Why do attackers so often pretend to be a bank, a school or a delivery company?", "რატომ ასაღებენ თავდამსხმელები თავს ასე ხშირად ბანკად, სკოლად ან მიტანის სამსახურად?"),
      l("Your phone asks to install an update right before a test. Now or later — and why?", "ტელეფონი გამოცდის წინ განახლების დაყენებას გთავაზობს. ახლა თუ მოგვიანებით — და რატომ?"),
    ],
    assessment: [
      l("A combinations calculation that shows why length matters.", "კომბინაციების გამოთვლა, რომელიც აჩვენებს, რატომ არის სიგრძე მნიშვნელოვანი."),
      l("At least three warning signs identified in a sample phishing message.", "ნიმუშ ფიშინგის შეტყობინებაში მინიმუმ სამი საგანგაშო ნიშნის ამოცნობა."),
    ],
    homework: [
      l("Check one account you use: is two-factor authentication on? If not, turn it on with an adult's help.", "შეამოწმე ერთი ანგარიში, რომელსაც იყენებ: ჩართულია ორფაქტორიანი ავთენტიკაცია? თუ არა, უფროსის დახმარებით ჩართე."),
      l("Make a passphrase from four unrelated words and a number. Do not write it down or share it.", "შეადგინე ფრაზა-პაროლი ოთხი დაუკავშირებელი სიტყვითა და რიცხვით. არ ჩაიწერო და არავის გაუზიარო."),
    ],
    teacherNotes: l(
      "Never ask students to type or say real passwords, not even \"to test them\". Use made-up examples only. Link the lesson to the school accounts: students received a temporary password on a slip and should replace it under \"My account\". If a student reports a real incident, follow the school's procedure and involve parents.",
      "მოსწავლეებს არასდროს სთხოვოთ ნამდვილი პაროლის აკრეფა ან თქმა, თუნდაც „შესამოწმებლად“. გამოიყენეთ მხოლოდ მოგონილი მაგალითები. დაუკავშირეთ გაკვეთილი სასკოლო ანგარიშებს: მოსწავლეებმა დროებითი პაროლი ფურცელზე მიიღეს და ის „ჩემს ანგარიშში“ უნდა შეცვალონ. თუ მოსწავლე ნამდვილ შემთხვევას შეგატყობინებთ, იმოქმედეთ სკოლის წესით და ჩართეთ მშობლები.",
    ),
    quiz: {
      title: l("Cybersecurity — check yourself", "კიბერუსაფრთხოება — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("How many different 3-digit codes (000–999) are there?", "რამდენი განსხვავებული 3-ნიშნა კოდი არსებობს (000–999)?"), answer: 1000, explanation: l("10 · 10 · 10 = 1000", "10 · 10 · 10 = 1000") },
        { type: "tf", prompt: l("Using the same strong password on every website is safe.", "ერთი და იმავე ძლიერი პაროლის გამოყენება ყველა საიტზე უსაფრთხოა."), answer: false, explanation: l("If one site leaks it, every account is open.", "თუ ერთი საიტიდან გაჟონავს, ყველა ანგარიში ღიაა.") },
        { type: "tf", prompt: l("A real teacher or support team may ask for your password by message.", "ნამდვილმა მასწავლებელმა ან დახმარების სამსახურმა შეტყობინებით შეიძლება პაროლი მოგთხოვოს."), answer: false, explanation: l("Real staff never ask for passwords.", "ნამდვილი თანამშრომლები პაროლს არასდროს ითხოვენ.") },
        {
          type: "mc",
          prompt: l("Which is a warning sign of phishing?", "რომელია ფიშინგის საგანგაშო ნიშანი?"),
          options: [l("\"Act within 1 hour or lose your account\"", "„იმოქმედე 1 საათში, თორემ ანგარიშს დაკარგავ“"), l("A message from a friend you were expecting", "მოსალოდნელი შეტყობინება მეგობრისგან"), l("A website address you typed yourself", "ვებმისამართი, რომელიც თავად აკრიფე"), l("A lock icon next to the address", "ბოქლომის ნიშანი მისამართის გვერდით")],
          correct: 0,
        },
      ],
    },
  },
  {
    group: "ai-literacy",
    subject: "computer_science",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /artificial intelligence|\bai\b|machine learning|chatbot|neural|ხელოვნური ინტელექტ|მანქანური სწავლ|ჩატბოტ/i,
    title: l("AI Literacy: How AI Tools Work and When to Check Them", "ხელოვნური ინტელექტის წიგნიერება: როგორ მუშაობს AI და როდის უნდა გადაამოწმო"),
    topic: l("Artificial intelligence", "ხელოვნური ინტელექტი"),
    objective: l(
      "Students explain that AI systems learn patterns from examples, recognise typical errors (invented facts, bias, missing knowledge) and use AI tools honestly and safely.",
      "მოსწავლეები ხსნიან, რომ AI სისტემები მაგალითებიდან სწავლობენ კანონზომიერებებს, ამოიცნობენ ტიპურ შეცდომებს (მოგონილი ფაქტები, მიკერძოება, ცოდნის ნაკლებობა) და AI ხელსაწყოებს პატიოსნად და უსაფრთხოდ იყენებენ.",
    ),
    objectives: [
      l("Explain in simple terms how a machine-learning system learns from training data.", "მარტივად ახსნას, როგორ სწავლობს მანქანური სწავლების სისტემა სასწავლო მონაცემებიდან."),
      l("Explain why a chatbot can write fluent text that is false.", "ახსნას, რატომ შეუძლია ჩატბოტს გამართული, მაგრამ მცდარი ტექსტის დაწერა."),
      l("Recognise bias and gaps that come from the training data.", "ამოიცნოს სასწავლო მონაცემებიდან მომდინარე მიკერძოება და ხარვეზები."),
      l("Follow simple rules for honest and safe use of AI at school.", "დაიცვას სკოლაში AI-ის პატიოსნად და უსაფრთხოდ გამოყენების მარტივი წესები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Confident and wrong", "თავდაჯერებული და მცდარი"),
        minutes: 5,
        body: l(
          `A student asks a chatbot: "When was the Battle of Didgori?" It answers in perfect sentences: "The Battle of Didgori took place in 1221", and even names a book as its source.

The battle was in 1121, and the book does not exist. How can a tool that writes so well be so wrong? To use AI well, we need to know what it actually does.`,
          `მოსწავლე ჩატბოტს ეკითხება: „როდის მოხდა დიდგორის ბრძოლა?“ ის გამართული წინადადებებით პასუხობს: „დიდგორის ბრძოლა 1221 წელს მოხდა“ და წყაროდ წიგნსაც ასახელებს.

ბრძოლა 1121 წელს მოხდა, წიგნი კი არ არსებობს. როგორ შეიძლება ასე კარგად მწერალი ხელსაწყო ასე ცდებოდეს? AI-ის კარგად გამოსაყენებლად უნდა ვიცოდეთ, რას აკეთებს ის სინამდვილეში.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Learning from examples", "მაგალითებიდან სწავლა"),
        minutes: 12,
        body: l(
          `Most of today's AI is machine learning. Instead of writing every rule by hand, people show a program many examples — the training data — and it adjusts itself to find patterns.

Example: show a program 10 000 photos labelled "cat" or "dog". It learns which patterns of pixels usually go with each label. Show it a new photo and it answers with the label that fits best.

Important consequences:
• It only knows what was in its examples. Show the cat-and-dog program a rabbit and it will still say "cat" or "dog" — it has no other answer.
• If the examples are unbalanced, the results are too. A face-recognition system trained mostly on one group of people makes more mistakes with others. A system trained on few Georgian texts writes weaker Georgian.
• It is measured by testing on examples it has not seen: 180 correct out of 200 means 90% accuracy — and still 20 mistakes.`,
          `დღევანდელი AI-ის უმეტესობა მანქანური სწავლებაა. ყველა წესს ხელით რომ არ ვწერდეთ, პროგრამას ბევრ მაგალითს ვაჩვენებთ — ეს სასწავლო მონაცემებია — ის კი თავს ისე არეგულირებს, რომ კანონზომიერებები იპოვოს.

მაგალითი: პროგრამას აჩვენე 10 000 ფოტო წარწერებით „კატა“ ან „ძაღლი“. ის სწავლობს, პიქსელების რომელი ნიმუშები ახლავს ჩვეულებრივ თითოეულ წარწერას. აჩვენე ახალი ფოტო — და ის იმ წარწერით გიპასუხებს, რომელიც ყველაზე მეტად ერგება.

მნიშვნელოვანი შედეგები:
• მან მხოლოდ ის იცის, რაც მის მაგალითებში იყო. კატებსა და ძაღლებზე ნასწავლ პროგრამას კურდღელი აჩვენე — მაინც იტყვის „კატას“ ან „ძაღლს“: სხვა პასუხი არ აქვს.
• თუ მაგალითები დაუბალანსებელია, შედეგებიც ასეთივეა. სახის ამოცნობის სისტემა, რომელიც ძირითადად ადამიანების ერთ ჯგუფზე ისწავლეს, სხვებთან მეტს ცდება. სისტემა, რომელსაც ცოტა ქართული ტექსტი უნახავს, ქართულად უფრო სუსტად წერს.
• მას ამოწმებენ მაგალითებზე, რომლებიც არ უნახავს: 200-დან 180 სწორი პასუხი 90%-იან სიზუსტეს ნიშნავს — და მაინც 20 შეცდომას.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Chatbots predict words", "ჩატბოტები სიტყვებს წინასწარმეტყველებენ"),
        minutes: 10,
        body: l(
          `A chatbot is a language model trained on enormous amounts of text. It writes by predicting, again and again, which word is likely to come next. That is why its text sounds natural.

But "likely to sound right" is not the same as "true":
• It can invent facts, quotes, dates and sources that look real ("hallucinations").
• Its knowledge stops at the date its training data was collected.
• It does not know what it does not know, so it rarely says "I'm not sure".

Rules for school:
1. Check every fact that matters in a reliable source (a textbook, an official site), and check that cited sources exist.
2. Say when and how you used AI. Handing in AI text as your own work is not honest.
3. Do the thinking yourself: use AI to explain, give examples or check, not to replace your work.
4. Never type personal data — yours or anyone else's: names, addresses, photos, passwords.

In Future Classroom, AI is optional and always labelled; everything works without it.`,
          `ჩატბოტი ენის მოდელია, რომელიც უზარმაზარ ტექსტებზეა ნასწავლი. ის წერს იმის წინასწარმეტყველებით, რომელი სიტყვაა ყველაზე მოსალოდნელი შემდეგ — ისევ და ისევ. ამიტომ ჟღერს მისი ტექსტი ბუნებრივად.

მაგრამ „სწორად ჟღერს“ არ ნიშნავს „მართალია“:
• მას შეუძლია მოიგონოს ფაქტები, ციტატები, თარიღები და წყაროები, რომლებიც ნამდვილს ჰგავს („ჰალუცინაციები“).
• მისი ცოდნა იმ თარიღით მთავრდება, როცა სასწავლო მონაცემები შეგროვდა.
• მან არ იცის, რა არ იცის, ამიტომ იშვიათად ამბობს „დარწმუნებული არ ვარ“.

სასკოლო წესები:
1. ყოველი მნიშვნელოვანი ფაქტი სანდო წყაროში გადაამოწმე (სახელმძღვანელოში, ოფიციალურ საიტზე) და შეამოწმე, არსებობს თუ არა დასახელებული წყაროები.
2. თქვი, როდის და როგორ გამოიყენე AI. AI-ის ტექსტის საკუთარ ნამუშევრად ჩაბარება პატიოსანი არ არის.
3. თავად იფიქრე: AI ახსნისთვის, მაგალითებისთვის ან შესამოწმებლად გამოიყენე და არა შენი მუშაობის შესაცვლელად.
4. არასდროს აკრიფო პერსონალური მონაცემები — არც შენი, არც სხვისი: სახელები, მისამართები, ფოტოები, პაროლები.

„მომავლის საკლასო ოთახში“ AI არასავალდებულოა და ყოველთვის მონიშნულია; ყველაფერი მის გარეშეც მუშაობს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 13,
        body: l(
          `Complete the activities. Then play "human classifier": the teacher shows pictures one by one; the class sorts them into two groups using only the examples seen so far. Which pictures were hard, and why?`,
          `შეასრულე აქტივობები. შემდეგ ითამაშეთ „ადამიანი-კლასიფიკატორი“: მასწავლებელი სურათებს სათითაოდ აჩვენებს, კლასი კი მათ ორ ჯგუფად ანაწილებს მხოლოდ მანამდე ნანახი მაგალითების მიხედვით. რომელი სურათები იყო რთული და რატომ?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Machine learning finds patterns in training data; it knows only what its examples contain.
• Unbalanced data → unfair or weaker results.
• Chatbots predict likely words: fluent is not the same as true. Check facts and sources.
• Be open about using AI, think for yourself, and keep personal data out.`,
          `• მანქანური სწავლება სასწავლო მონაცემებში კანონზომიერებებს პოულობს; მან მხოლოდ ის იცის, რაც მის მაგალითებშია.
• დაუბალანსებელი მონაცემები → უსამართლო ან უფრო სუსტი შედეგები.
• ჩატბოტები მოსალოდნელ სიტყვებს წინასწარმეტყველებენ: გამართული არ ნიშნავს მართალს. გადაამოწმე ფაქტები და წყაროები.
• AI-ის გამოყენება არ დამალო, თავად იფიქრე და პერსონალური მონაცემები არ გაამხილო.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("A rabbit for the cat-and-dog program", "კურდღელი კატა-ძაღლის პროგრამისთვის"),
        prompt: l("A program trained only on photos of cats and dogs is shown a photo of a rabbit. What will it most likely do?", "მხოლოდ კატებისა და ძაღლების ფოტოებზე ნასწავლ პროგრამას კურდღლის ფოტოს აჩვენებენ. რას იზამს ის, დიდი ალბათობით?"),
        options: [l("Label it \"cat\" or \"dog\" anyway", "მაინც „კატად“ ან „ძაღლად“ მონიშნავს"), l("Say \"rabbit\"", "იტყვის „კურდღელს“"), l("Refuse to answer", "პასუხზე უარს იტყვის"), l("Search the internet for the answer", "პასუხს ინტერნეტში მოძებნის")],
        correct: 0,
        hints: [l("Which answers can this program give at all?", "რა პასუხების გაცემა შეუძლია საერთოდ ამ პროგრამას?"), l("It learned only two labels from its examples.", "მაგალითებიდან მან მხოლოდ ორი წარწერა ისწავლა.")],
        explanation: l("It can only choose between the labels it was trained on.", "მას მხოლოდ იმ წარწერებს შორის შეუძლია არჩევა, რომლებზეც ისწავლა."),
      },
      {
        type: "mc",
        title: l("Didgori", "დიდგორი"),
        prompt: l(
          "A chatbot says the Battle of Didgori took place in 1221 and names a book as its source. What is the best next step?",
          "ჩატბოტი ამბობს, რომ დიდგორის ბრძოლა 1221 წელს მოხდა და წყაროდ წიგნს ასახელებს. რა არის საუკეთესო შემდეგი ნაბიჯი?",
        ),
        options: [
          l("Check the date in the history textbook and check whether the book exists", "თარიღი ისტორიის სახელმძღვანელოში გადაამოწმო და შეამოწმო, არსებობს თუ არა წიგნი"),
          l("Trust it, because it named a source", "ენდო, რადგან წყარო დაასახელა"),
          l("Ask the chatbot if it is sure", "ჩატბოტს ჰკითხო, დარწმუნებულია თუ არა"),
          l("Use it, because the sentences are well written", "გამოიყენო, რადგან წინადადებები კარგად არის დაწერილი"),
        ],
        correct: 0,
        hints: [l("Can a chatbot invent a source that looks real?", "შეუძლია ჩატბოტს ნამდვილის მსგავსი წყაროს მოგონება?"), l("Where can you check a historical date independently of the chatbot?", "სად შეგიძლია ისტორიული თარიღის შემოწმება ჩატბოტისგან დამოუკიდებლად?")],
        explanation: l("Check facts and sources outside the chatbot. (The battle was in 1121.)", "ფაქტები და წყაროები ჩატბოტის გარეთ გადაამოწმე. (ბრძოლა 1121 წელს მოხდა.)"),
      },
      {
        type: "exercise",
        title: l("Accuracy", "სიზუსტე"),
        prompt: l("A spam filter is tested on 200 emails and sorts 180 of them correctly. What is its accuracy, in percent?", "სპამის ფილტრი 200 წერილზე შეამოწმეს და მან 180 სწორად დაახარისხა. რისი ტოლია მისი სიზუსტე პროცენტებში?"),
        accepted: ["90", "90%"],
        hints: [l("Accuracy = correct ÷ total × 100.", "სიზუსტე = სწორი ÷ სულ × 100."), l("180 ÷ 200 = 0.9. Now turn it into a percentage.", "180 ÷ 200 = 0,9. ახლა პროცენტებად გადაიყვანე.")],
        solution: l("180 ÷ 200 × 100 = 90% — still 20 mistakes.", "180 ÷ 200 × 100 = 90% — და მაინც 20 შეცდომა."),
      },
      {
        type: "mc",
        title: l("Safe to paste?", "უსაფრთხოა ჩასმა?"),
        prompt: l("Which of these is safe to paste into a public AI chatbot?", "რომლის ჩასმაა ამათგან უსაფრთხო საჯარო AI ჩატბოტში?"),
        options: [
          l("A paragraph of your own essay with no names in it", "შენი ესეს აბზაცი, რომელშიც სახელები არ არის"),
          l("Your home address and phone number", "შენი მისამართი და ტელეფონის ნომერი"),
          l("A photo of your friend", "შენი მეგობრის ფოტო"),
          l("Your password, to check if it is strong", "შენი პაროლი, სიძლიერის შესამოწმებლად"),
        ],
        correct: 0,
        hints: [l("Anything you type may be stored and used by the company that runs the chatbot.", "ყველაფერი, რასაც აკრეფ, შეიძლება შეინახოს და გამოიყენოს ჩატბოტის მფლობელმა კომპანიამ."), l("Which option contains no personal data about anyone?", "რომელი ვარიანტი არ შეიცავს არავის პერსონალურ მონაცემებს?")],
        explanation: l("Keep personal data and passwords out; your own text without names is fine.", "პერსონალური მონაცემები და პაროლები არ გაამხილო; შენი ტექსტი სახელების გარეშე მისაღებია."),
      },
      {
        type: "mc",
        title: l("Georgian and English", "ქართული და ინგლისური"),
        prompt: l("Why might an AI tool write better English than Georgian?", "რატომ შეიძლება AI ხელსაწყო ინგლისურად უკეთ წერდეს, ვიდრე ქართულად?"),
        options: [
          l("Its training data contained far more English than Georgian text", "მის სასწავლო მონაცემებში ქართულზე გაცილებით მეტი ინგლისური ტექსტი იყო"),
          l("Georgian is too hard for computers", "ქართული კომპიუტერებისთვის ზედმეტად რთულია"),
          l("Georgian letters cannot be stored in computers", "ქართული ასოების შენახვა კომპიუტერში შეუძლებელია"),
          l("It is programmed to prefer English", "ის ინგლისურის უპირატესობაზეა დაპროგრამებული"),
        ],
        correct: 0,
        hints: [l("A machine-learning system is only as good as its examples.", "მანქანური სწავლების სისტემა იმდენად კარგია, რამდენადაც მისი მაგალითები."), l("On the internet, is there more text in English or in Georgian?", "ინტერნეტში მეტი ტექსტია ინგლისურად თუ ქართულად?")],
        explanation: l("Fewer Georgian examples in the training data mean weaker Georgian.", "სასწავლო მონაცემებში ნაკლები ქართული მაგალითი ნიშნავს უფრო სუსტ ქართულს."),
      },
      {
        type: "discussion",
        prompt: l("When is using AI for homework helpful, and when does it become cheating? Where would you draw the line?", "როდის არის AI-ის გამოყენება საშინაო დავალებისთვის სასარგებლო და როდის ხდება ეს თაღლითობა? სად გაავლებდი ზღვარს?"),
      },
      { type: "exit", prompt: l("Write one thing AI tools do well and one reason to check what they say.", "დაწერე ერთი რამ, რასაც AI ხელსაწყოები კარგად აკეთებს, და ერთი მიზეზი, რატომ უნდა გადაამოწმო მათი ნათქვამი.") },
    ],
    discussion: [
      l("Should a school ban AI tools, allow them everywhere, or something in between? Give reasons.", "სკოლამ უნდა აკრძალოს AI ხელსაწყოები, ყველგან დაუშვას თუ რაღაც შუალედური? დაასაბუთე."),
      l("Who is responsible when an AI system makes an unfair decision about a person?", "ვინ არის პასუხისმგებელი, როცა AI სისტემა ადამიანზე უსამართლო გადაწყვეტილებას იღებს?"),
    ],
    assessment: [
      l("A correct explanation of training data and why a model can be wrong.", "სასწავლო მონაცემებისა და მოდელის შეცდომის მიზეზის სწორი ახსნა."),
      l("A checked claim: a chatbot answer compared with a reliable source.", "გადამოწმებული მტკიცება: ჩატბოტის პასუხის შედარება სანდო წყაროსთან."),
    ],
    homework: [
      l("If you use an AI tool at home (with permission), ask it three questions about a topic you know well. Check each answer and note any mistakes.", "თუ სახლში AI ხელსაწყოს იყენებ (ნებართვით), დაუსვი სამი კითხვა თემაზე, რომელიც კარგად იცი. თითოეული პასუხი გადაამოწმე და ჩაინიშნე შეცდომები."),
      l("Write your own \"AI rules\" for your class: five short rules you would agree to follow.", "დაწერე შენი კლასის „AI-ის წესები“: ხუთი მოკლე წესი, რომლის დაცვაზეც დათანხმდებოდი."),
    ],
    teacherNotes: l(
      "The lesson needs no AI tool: every activity works on paper. If you demonstrate a chatbot, use the school's approved tool and never type students' personal data. Follow the school's own rules on AI use for homework; the discussion is a good place to agree class rules. The Didgori example is deliberately simple to check (1121).",
      "გაკვეთილს AI ხელსაწყო არ სჭირდება: ყველა აქტივობა ქაღალდზეც მუშაობს. თუ ჩატბოტს აჩვენებთ, გამოიყენეთ სკოლის მიერ დამტკიცებული ხელსაწყო და არასდროს აკრიფოთ მოსწავლეების პერსონალური მონაცემები. საშინაო დავალებაში AI-ის გამოყენებისას სკოლის წესებს მიჰყევით; დისკუსია კლასის წესებზე შესათანხმებლად კარგი შესაძლებლობაა. დიდგორის მაგალითი განზრახ ადვილად შესამოწმებელია (1121).",
    ),
    quiz: {
      title: l("AI literacy — check yourself", "AI-ის წიგნიერება — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("If a chatbot names a source, the source must exist.", "თუ ჩატბოტი წყაროს ასახელებს, ეს წყარო აუცილებლად არსებობს."), answer: false, explanation: l("Chatbots can invent sources that look real.", "ჩატბოტებს ნამდვილის მსგავსი წყაროების მოგონება შეუძლიათ.") },
        { type: "num", prompt: l("A model is right 45 times out of 50. Accuracy in percent?", "მოდელი 50-დან 45-ჯერ მართალია. სიზუსტე პროცენტებში?"), answer: 90, explanation: l("45 ÷ 50 × 100 = 90%", "45 ÷ 50 × 100 = 90%") },
        {
          type: "mc",
          prompt: l("What do machine-learning systems learn from?", "რისგან სწავლობს მანქანური სწავლების სისტემა?"),
          options: [l("Examples in their training data", "სასწავლო მონაცემებში არსებული მაგალითებიდან"), l("Rules written for every case", "ყოველი შემთხვევისთვის დაწერილი წესებიდან"), l("Their own experience of the world", "სამყაროს საკუთარი გამოცდილებიდან"), l("Nothing: they already know everything", "არაფრისგან: მათ ყველაფერი უკვე იციან")],
          correct: 0,
        },
        { type: "tf", prompt: l("It is fine to type a classmate's full name and address into a public chatbot.", "საჯარო ჩატბოტში თანაკლასელის სრული სახელისა და მისამართის აკრეფა ნორმალურია."), answer: false, explanation: l("Never share other people's personal data.", "სხვისი პერსონალური მონაცემები არასდროს გაამხილო.") },
      ],
    },
  },
];

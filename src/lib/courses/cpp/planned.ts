import { T } from "../author";
import type { PlannedModule } from "../types";

/** The rest of the roadmap: shown on the course map as "planned", with the book chapter to practise meanwhile. */
export const planned: PlannedModule[] = [
  {
    number: 3,
    title: T("ციკლები", "Loops"),
    summary: T("პროგრამა იმეორებს: `while`, `for`, ჩალაგებული ციკლები და ტიპური ამოცანები.", "The program repeats: `while`, `for`, nested loops and typical tasks."),
    topics: [T("`while` და `for`"), T("`do-while`, `break`, `continue`"), T("ჩალაგებული ციკლები და ნახაზები"), T("ციფრები, მარტივი რიცხვები, უდიდესი საერთო გამყოფი"), T("მონაცემების წაკითხვა ბოლომდე")],
  },
  {
    number: 4,
    title: T("ფუნქციები", "Functions"),
    summary: T("დიდი ამოცანის დანაწევრება: პარამეტრები, დაბრუნება, მიმართვები და რეკურსიის პირველი ნაბიჯები.", "Splitting a big task: parameters, return values, references and first steps in recursion."),
    topics: [T("პარამეტრები და დაბრუნებული მნიშვნელობა"), T("ხილვადობის არე"), T("მიმართვა `&` და `const`"), T("გადატვირთვა და ნაგულისხმევი მნიშვნელობები"), T("რეკურსია I")],
  },
  {
    number: 5,
    title: T("მასივები და ვექტორები", "Arrays and vectors"),
    summary: T("მონაცემების სიები: `vector`, ძებნა, მინიმუმი და მაქსიმუმი, ორგანზომილებიანი ცხრილები, დალაგება.", "Lists of data: `vector`, search, minimum and maximum, 2D tables, sorting."),
    topics: [T("მასივი და `vector`"), T("ძებნა, მინიმუმი, მაქსიმუმი"), T("ცხრილები"), T("დალაგება"), T("ჯამები პრეფიქსებით, ორი მაჩვენებელი")],
    book: { chapter: 8 },
  },
  {
    number: 6,
    title: T("სტრიქონები", "Strings"),
    summary: T("ტექსტთან მუშაობა: `string`, სიმბოლოები, ძებნა, ჩანაცვლება და კლასიკური ამოცანები.", "Working with text: `string`, characters, search, replace and classic tasks."),
    topics: [T("`string` და ინდექსები"), T("სიმბოლოები და `ctype`"), T("`getline`"), T("`find`, `substr`, `replace`"), T("`stringstream`")],
    book: { chapter: 9 },
  },
  {
    number: 7,
    title: T("სტრუქტურები და მაჩვენებლები", "Structs and pointers"),
    summary: T("საკუთარი ტიპები და მეხსიერების ახლოდან გაცნობა.", "Your own types and a closer look at memory."),
    topics: [T("`struct`"), T("მისამართი და მაჩვენებელი"), T("დინამიკური მეხსიერება"), T("მასივები და მაჩვენებლები")],
  },
  {
    number: 8,
    title: T("სტანდარტული ბიბლიოთეკა (STL)", "The standard library (STL)"),
    summary: T("მზა და სწრაფი ინსტრუმენტები: `map`, `set`, `queue`, `stack`, ალგორითმები.", "Ready and fast tools: `map`, `set`, `queue`, `stack`, algorithms."),
    topics: [T("`pair`, `map`, `set`"), T("`stack`, `queue`, `deque`"), T("`sort`, `find`, `count`, `accumulate`"), T("იტერატორები"), T("ლამბდა-ფუნქციები")],
    book: { chapter: 12 },
  },
  {
    number: 9,
    title: T("კლასები და ობიექტზე ორიენტირებული პროგრამირება", "Classes and object-oriented programming"),
    summary: T("კლასები, კონსტრუქტორები, მემკვიდრეობა და პოლიმორფიზმი.", "Classes, constructors, inheritance and polymorphism."),
    topics: [T("კლასი და ობიექტი"), T("კონსტრუქტორი და დესტრუქტორი"), T("ინკაფსულაცია"), T("მემკვიდრეობა და `virtual`"), T("ოპერატორების გადატვირთვა")],
  },
  {
    number: 10,
    title: T("რეკურსია და გადარჩევა", "Recursion and backtracking"),
    summary: T("ამოცანის თავის თავზე დაყვანა; ვარიანტების სისტემური გადარჩევა.", "Reducing a task to itself; trying all options systematically."),
    topics: [T("რეკურსიული აზროვნება"), T("კომბინაციები და გადანაცვლებები"), T("უკან დაბრუნება"), T("მეხსიერებაში შენახვა (მემოიზაცია)")],
    book: { chapter: 13 },
  },
  {
    number: 11,
    title: T("დალაგება, ძებნა და სირთულე", "Sorting, searching and complexity"),
    summary: T("როგორ გავიგოთ, რამდენად სწრაფია პროგრამა და როგორ გავასწრაფოთ.", "How to tell how fast a program is, and how to make it faster."),
    topics: [T("ალგორითმის სირთულე"), T("ორობითი ძებნა"), T("დალაგების ალგორითმები"), T("პასუხზე ორობითი ძებნა")],
    book: { chapter: 10 },
  },
  {
    number: 12,
    title: T("ხარბი ალგორითმები და დინამიკური პროგრამირება", "Greedy algorithms and dynamic programming"),
    summary: T("ოპტიმალური ამოხსნის პოვნა ბევრი ვარიანტიდან.", "Finding the best solution among many."),
    topics: [T("ხარბი არჩევანი"), T("ერთგანზომილებიანი DP"), T("ზურგჩანთის ამოცანა"), T("უდიდესი საერთო ქვემიმდევრობა")],
    book: { chapter: 14 },
  },
  {
    number: 13,
    title: T("გრაფები და ხეები", "Graphs and trees"),
    summary: T("ქსელების, რუკებისა და იერარქიების ამოცანები.", "Problems about networks, maps and hierarchies."),
    topics: [T("გრაფის წარმოდგენა"), T("სიღრმეში და სიგანეში ძებნა"), T("უმოკლესი გზა"), T("ხეები")],
    book: { chapter: 15 },
  },
  {
    number: 14,
    title: T("საბოლოო პროექტები", "Final projects"),
    summary: T("რამდენიმე დიდი პროექტი, სადაც ყველაფერი ერთად გჭირდება.", "A few bigger projects that use everything together."),
    topics: [T("ტექსტური თამაში"), T("მონაცემთა ბაზა ფაილის გარეშე"), T("მცირე სიმულაცია")],
  },
];

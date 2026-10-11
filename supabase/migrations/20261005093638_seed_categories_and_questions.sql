/*
# Seed categories and sample quizzes with questions

## Summary
Inserts 14 computer science / general knowledge categories, creates one sample
quiz per main category, and adds 5 multiple-choice questions per quiz.
This is idempotent — uses ON CONFLICT DO NOTHING for categories, and DO blocks
to check for existing quizzes/questions before inserting.

## Categories Seeded (14 total)
1. Python
2. C Programming
3. Java
4. JavaScript
5. HTML
6. CSS
7. DBMS
8. Data Structures
9. Computer Networks
10. Operating Systems
11. Software Engineering
12. Computer Fundamentals
13. Digital Electronics
14. General Knowledge

## Quizzes and Questions
Each of the 14 categories gets one quiz with 5 questions.
Questions use JSONB options arrays with 4 choices each.

## Security
No security changes — only data insertion into already-protected tables.

## Important Notes
1. Categories use ON CONFLICT (slug) DO NOTHING — safe to re-run.
2. Quizzes and questions use DO $$ blocks to check existence before inserting.
3. All content is publicly readable via the RLS policies created in the previous migration.
*/

-- Insert categories (idempotent via slug unique conflict)
INSERT INTO categories (slug, name, description, icon_name, color, sort_order) VALUES
('python', 'Python', 'Master Python programming from basics to advanced concepts', 'FileCode', 'from-blue-500 to-yellow-500', 1),
('c-programming', 'C Programming', 'Learn the fundamentals of the C programming language', 'FileCode', 'from-blue-600 to-cyan-500', 2),
('java', 'Java', 'Explore Java syntax, OOP, and enterprise development', 'Coffee', 'from-orange-500 to-red-500', 3),
('javascript', 'JavaScript', 'Master modern JavaScript and web development', 'FileCode', 'from-yellow-400 to-amber-500', 4),
('html', 'HTML', 'Learn the structure of web pages with HTML5', 'Code', 'from-orange-500 to-orange-600', 5),
('css', 'CSS', 'Style the web with modern CSS techniques', 'Palette', 'from-blue-500 to-indigo-500', 6),
('dbms', 'DBMS', 'Database Management Systems, SQL, and normalization', 'Database', 'from-green-500 to-emerald-500', 7),
('data-structures', 'Data Structures', 'Master arrays, linked lists, trees, graphs, and more', 'Network', 'from-purple-500 to-pink-500', 8),
('computer-networks', 'Computer Networks', 'Protocols, layers, routing, and network architecture', 'Network', 'from-teal-500 to-cyan-500', 9),
('operating-systems', 'Operating Systems', 'Processes, memory management, scheduling, and file systems', 'Monitor', 'from-slate-500 to-slate-700', 10),
('software-engineering', 'Software Engineering', 'Software development lifecycle, testing, and methodologies', 'Workflow', 'from-indigo-500 to-purple-500', 11),
('computer-fundamentals', 'Computer Fundamentals', 'Hardware, software, and basic computing concepts', 'Cpu', 'from-cyan-500 to-blue-500', 12),
('digital-electronics', 'Digital Electronics', 'Logic gates, flip-flops, and digital circuit design', 'CircuitBoard', 'from-emerald-500 to-teal-500', 13),
('general-knowledge', 'General Knowledge', 'Test your awareness of the world around you', 'Globe', 'from-amber-500 to-orange-500', 14)
ON CONFLICT (slug) DO NOTHING;

-- Helper function to get category id by slug
DO $$
DECLARE
  v_cat_id uuid;
  v_quiz_id uuid;
BEGIN
  -- ===== PYTHON =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'python';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'Python Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'Python Basics', 'Test your knowledge of Python fundamentals', 'Easy')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which keyword is used to define a function in Python?', '["def","function","func","define"]'::jsonb, 0, 'The "def" keyword is used to define functions in Python.'),
    (v_quiz_id, 'What is the output of: print(type(5))?', '["<class ''int''>","<class ''number''>","<class ''float''>","<class ''str''>"]'::jsonb, 0, 'In Python, integers are of type int.'),
    (v_quiz_id, 'Which of these is NOT a Python data type?', '["list","tuple","array","dictionary"]'::jsonb, 2, 'Python does not have a built-in array type; use lists instead.'),
    (v_quiz_id, 'What does the len() function return?', '["The last element","The number of items","The first element","The type"]'::jsonb, 1, 'len() returns the number of items in an object.'),
    (v_quiz_id, 'Which symbol starts a single-line comment in Python?', '["//","#","--","/*"]'::jsonb, 1, 'Python uses # for single-line comments.');
  END IF;

  -- ===== C PROGRAMMING =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'c-programming';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'C Programming Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'C Programming Basics', 'Test your knowledge of C language fundamentals', 'Easy')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which header file is needed for printf()?', '["<stdio.h>","<stdlib.h>","<string.h>","<math.h>"]'::jsonb, 0, 'printf() is declared in stdio.h (standard input/output).'),
    (v_quiz_id, 'What is the size of int in C (on most systems)?', '["2 bytes","4 bytes","8 bytes","1 byte"]'::jsonb, 1, 'On most modern systems, int is 4 bytes (32 bits).'),
    (v_quiz_id, 'Which operator is used to access the value at an address?', '["&","*","->","."] '::jsonb, 1, 'The * (dereference) operator accesses the value at a pointer address.'),
    (v_quiz_id, 'What does the malloc() function return?', '["int","char","void* pointer","float"]'::jsonb, 2, 'malloc() returns a void pointer to the allocated memory.'),
    (v_quiz_id, 'Which keyword stops a loop in C?', '["stop","exit","break","return"]'::jsonb, 2, 'The break statement exits a loop immediately.');
  END IF;

  -- ===== JAVA =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'java';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'Java Fundamentals' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'Java Fundamentals', 'Test your knowledge of Java programming', 'Medium')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which keyword is used to inherit a class in Java?', '["inherits","extends","implements","super"]'::jsonb, 1, 'The extends keyword is used for class inheritance in Java.'),
    (v_quiz_id, 'What is the entry point of a Java application?', '["start()","main()","run()","init()"]'::jsonb, 1, 'The main() method is the entry point of Java programs.'),
    (v_quiz_id, 'Which of these is NOT a primitive type in Java?', '["int","String","boolean","double"]'::jsonb, 1, 'String is a class, not a primitive type in Java.'),
    (v_quiz_id, 'What does JVM stand for?', '["Java Virtual Machine","Java Variable Method","Java Visual Module","Just Virtual Machine"]'::jsonb, 0, 'JVM stands for Java Virtual Machine.'),
    (v_quiz_id, 'Which keyword prevents method overriding?', '["static","final","private","protected"]'::jsonb, 1, 'The final keyword prevents a method from being overridden.');
  END IF;

  -- ===== JAVASCRIPT =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'javascript';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'JavaScript Essentials' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'JavaScript Essentials', 'Test your JavaScript knowledge', 'Medium')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which keyword declares a block-scoped variable?', '["var","let","function","static"]'::jsonb, 1, 'let declares a block-scoped variable in JavaScript.'),
    (v_quiz_id, 'What is the result of: typeof null?', '["null","undefined","object","number"]'::jsonb, 2, 'typeof null returns "object" — a known JavaScript quirk.'),
    (v_quiz_id, 'Which method adds an element to the end of an array?', '["push()","pop()","shift()","unshift()"]'::jsonb, 0, 'push() adds one or more elements to the end of an array.'),
    (v_quiz_id, 'What does === check in JavaScript?', '["Value only","Type only","Value and type","Reference only"]'::jsonb, 2, 'The === operator checks both value and type (strict equality).'),
    (v_quiz_id, 'Which symbol is used for template literals?', '["Single quotes","Double quotes","Backticks","Brackets"]'::jsonb, 2, 'Template literals use backticks (`) in JavaScript.');
  END IF;

  -- ===== HTML =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'html';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'HTML Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'HTML Basics', 'Test your HTML knowledge', 'Easy')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'What does HTML stand for?', '["HyperText Markup Language","HighText Machine Language","HyperText Modern Language","Hyperlink Text Markup Language"]'::jsonb, 0, 'HTML stands for HyperText Markup Language.'),
    (v_quiz_id, 'Which tag creates the largest heading?', '["<h6>","<h1>","<head>","<header>"]'::jsonb, 1, 'The <h1> tag creates the largest heading in HTML.'),
    (v_quiz_id, 'Which attribute provides alternative text for images?', '["title","alt","src","description"]'::jsonb, 1, 'The alt attribute provides alternative text for images.'),
    (v_quiz_id, 'Which HTML element defines a hyperlink?', '["<link>","<a>","<nav>","<href>"]'::jsonb, 1, 'The <a> (anchor) element defines a hyperlink.'),
    (v_quiz_id, 'Which doctype declaration is used for HTML5?', '["<!DOCTYPE HTML5>","<!DOCTYPE html>","<!HTML5>","<!doctype html5>"]'::jsonb, 1, '<!DOCTYPE html> is the HTML5 doctype declaration.');
  END IF;

  -- ===== CSS =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'css';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'CSS Fundamentals' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'CSS Fundamentals', 'Test your CSS knowledge', 'Easy')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'What does CSS stand for?', '["Computer Style Sheets","Cascading Style Sheets","Creative Style Sheets","Colorful Style Sheets"]'::jsonb, 1, 'CSS stands for Cascading Style Sheets.'),
    (v_quiz_id, 'Which property changes the text color?', '["text-color","font-color","color","foreground"]'::jsonb, 2, 'The color property sets the text color in CSS.'),
    (v_quiz_id, 'How do you select an element with id "main"?', '[".main","#main","main","*main"]'::jsonb, 1, 'The # selector targets elements by id in CSS.'),
    (v_quiz_id, 'Which display value hides an element?', '["hidden","none","invisible","collapse"]'::jsonb, 1, 'display: none removes the element from the layout.'),
    (v_quiz_id, 'Which unit is relative to the root font size?', '["em","px","rem","vw"]'::jsonb, 2, 'rem is relative to the root element font size.');
  END IF;

  -- ===== DBMS =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'dbms';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'DBMS Concepts' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'DBMS Concepts', 'Test your database management knowledge', 'Medium')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which SQL command retrieves data from a table?', '["GET","SELECT","FETCH","RETRIEVE"]'::jsonb, 1, 'The SELECT statement retrieves data from a database.'),
    (v_quiz_id, 'What does ACID stand for in databases?', '["Atomicity, Consistency, Isolation, Durability","Accuracy, Completeness, Integrity, Data","Atomic, Correct, Isolated, Durable","Access, Control, Integrity, Data"]'::jsonb, 0, 'ACID = Atomicity, Consistency, Isolation, Durability.'),
    (v_quiz_id, 'Which key uniquely identifies a row?', '["Foreign key","Primary key","Candidate key","Super key"]'::jsonb, 1, 'A primary key uniquely identifies each row in a table.'),
    (v_quiz_id, 'Which normal form removes transitive dependencies?', '["1NF","2NF","3NF","BCNF"]'::jsonb, 2, 'Third Normal Form (3NF) removes transitive dependencies.'),
    (v_quiz_id, 'Which JOIN returns only matching rows from both tables?', '["OUTER JOIN","INNER JOIN","LEFT JOIN","CROSS JOIN"]'::jsonb, 1, 'INNER JOIN returns only the rows that match in both tables.');
  END IF;

  -- ===== DATA STRUCTURES =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'data-structures';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'Data Structures Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'Data Structures Basics', 'Test your data structures knowledge', 'Hard')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'What is the time complexity of binary search?', '["O(n)","O(log n)","O(n log n)","O(1)"]'::jsonb, 1, 'Binary search has O(log n) time complexity.'),
    (v_quiz_id, 'Which data structure uses LIFO ordering?', '["Queue","Stack","Tree","Graph"]'::jsonb, 1, 'A stack follows Last-In-First-Out (LIFO) ordering.'),
    (v_quiz_id, 'What is the worst-case time complexity of inserting into a hash table?', '["O(1)","O(n)","O(log n)","O(n log n)"]'::jsonb, 1, 'Hash table insertion is O(1) average, O(n) worst case (collisions).'),
    (v_quiz_id, 'In a binary tree, what is the maximum number of nodes at level L?', '["L","2^L","2L","L^2"]'::jsonb, 1, 'A binary tree has at most 2^L nodes at level L (root is level 0).'),
    (v_quiz_id, 'Which traversal visits root, left, then right?', '["Inorder","Preorder","Postorder","Level order"]'::jsonb, 1, 'Preorder traversal visits root → left → right.');
  END IF;

  -- ===== COMPUTER NETWORKS =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'computer-networks';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'Networking Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'Networking Basics', 'Test your computer networking knowledge', 'Medium')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'How many layers are in the OSI model?', '["5","6","7","8"]'::jsonb, 2, 'The OSI model has 7 layers.'),
    (v_quiz_id, 'Which protocol is connectionless?', '["TCP","UDP","HTTP","FTP"]'::jsonb, 1, 'UDP is a connectionless protocol; TCP is connection-oriented.'),
    (v_quiz_id, 'What is the default port for HTTP?', '["21","25","80","443"]'::jsonb, 2, 'HTTP uses port 80 by default.'),
    (v_quiz_id, 'What does IP stand for?', '["Internet Provider","Internet Protocol","Interconnected Process","Internal Path"]'::jsonb, 1, 'IP stands for Internet Protocol.'),
    (v_quiz_id, 'Which device operates at the network layer (Layer 3)?', '["Hub","Switch","Router","Repeater"]'::jsonb, 2, 'Routers operate at the network layer (Layer 3) of the OSI model.');
  END IF;

  -- ===== OPERATING SYSTEMS =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'operating-systems';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'OS Fundamentals' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'OS Fundamentals', 'Test your operating system knowledge', 'Medium')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which scheduling algorithm is non-preemptive?', '["Round Robin","Shortest Job First","Priority Preemptive","Multilevel Queue"]'::jsonb, 1, 'Shortest Job First (SJF) is typically non-preemptive.'),
    (v_quiz_id, 'What is a deadlock?', '["A process that never starts","A state where processes wait indefinitely for each other","A crash in the kernel","A terminated process"]'::jsonb, 1, 'A deadlock is a state where processes wait indefinitely for each others resources.'),
    (v_quiz_id, 'Which memory management technique uses paging?', '["Contiguous allocation","Virtual memory","Partitioning","Overlaying"]'::jsonb, 1, 'Virtual memory uses paging to manage memory.'),
    (v_quiz_id, 'What is the purpose of a semaphore?', '["Memory allocation","Process synchronization","File locking","Disk scheduling"]'::jsonb, 1, 'Semaphores are used for process synchronization.'),
    (v_quiz_id, 'Which system call creates a new process in Unix?', '["fork()","exec()","spawn()","create()"]'::jsonb, 0, 'The fork() system call creates a new process in Unix.');
  END IF;

  -- ===== SOFTWARE ENGINEERING =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'software-engineering';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'SE Concepts' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'SE Concepts', 'Test your software engineering knowledge', 'Medium')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'Which model is also called the waterfall model?', '["Iterative","Linear Sequential","Spiral","Agile"]'::jsonb, 1, 'The waterfall model follows a linear sequential approach.'),
    (v_quiz_id, 'What does SDLC stand for?', '["Software Design Life Cycle","Software Development Life Cycle","System Design Life Cycle","Software Development Logic Cycle"]'::jsonb, 1, 'SDLC stands for Software Development Life Cycle.'),
    (v_quiz_id, 'Which testing checks individual functions?', '["Integration testing","Unit testing","System testing","Acceptance testing"]'::jsonb, 1, 'Unit testing checks individual functions or components.'),
    (v_quiz_id, 'What is coupling in software engineering?', '["Degree of dependency between modules","Number of modules in a system","Speed of execution","Size of codebase"]'::jsonb, 0, 'Coupling measures the degree of dependency between modules.'),
    (v_quiz_id, 'Which is NOT an Agile framework?', '["Scrum","Kanban","XP","Waterfall"]'::jsonb, 3, 'Waterfall is a traditional model, not an Agile framework.');
  END IF;

  -- ===== COMPUTER FUNDAMENTALS =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'computer-fundamentals';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'Computer Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'Computer Basics', 'Test your computer fundamentals knowledge', 'Easy')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'What does CPU stand for?', '["Central Processing Unit","Computer Personal Unit","Central Process Utility","Computer Processing Unit"]'::jsonb, 0, 'CPU stands for Central Processing Unit.'),
    (v_quiz_id, 'Which is an input device?', '["Monitor","Printer","Keyboard","Speaker"]'::jsonb, 2, 'A keyboard is an input device; monitors and printers are output devices.'),
    (v_quiz_id, 'What does RAM stand for?', '["Read Access Memory","Random Access Memory","Rapid Access Memory","Read Available Memory"]'::jsonb, 1, 'RAM stands for Random Access Memory.'),
    (v_quiz_id, 'Which is the smallest unit of data?', '["Byte","Bit","Nibble","Kilobyte"]'::jsonb, 1, 'A bit is the smallest unit of data (0 or 1).'),
    (v_quiz_id, 'What is 1 byte equal to?', '["4 bits","8 bits","16 bits","2 bits"]'::jsonb, 1, '1 byte equals 8 bits.');
  END IF;

  -- ===== DIGITAL ELECTRONICS =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'digital-electronics';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'Digital Electronics Basics' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'Digital Electronics Basics', 'Test your digital electronics knowledge', 'Hard')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'How many inputs does a 2-input AND gate have?', '["1","2","3","4"]'::jsonb, 1, 'A 2-input AND gate has 2 inputs and 1 output.'),
    (v_quiz_id, 'What is the Boolean expression for a NAND gate?', '["A AND B","NOT (A AND B)","A OR B","NOT (A OR B)"]'::jsonb, 1, 'NAND is NOT (A AND B) — the negation of AND.'),
    (v_quiz_id, 'Which gate is called a universal gate?', '["OR","XOR","NAND","NOT"]'::jsonb, 2, 'NAND (and NOR) gates are universal — any logic can be built from them.'),
    (v_quiz_id, 'How many flip-flops are needed for a 4-bit counter?', '["2","3","4","8"]'::jsonb, 2, 'A 4-bit counter needs 4 flip-flops (one per bit).'),
    (v_quiz_id, 'What is the binary equivalent of decimal 10?', '["1010","1100","1001","1110"]'::jsonb, 0, 'Decimal 10 = binary 1010.');
  END IF;

  -- ===== GENERAL KNOWLEDGE =====
  SELECT id INTO v_cat_id FROM categories WHERE slug = 'general-knowledge';
  SELECT id INTO v_quiz_id FROM quizzes WHERE category_id = v_cat_id AND title = 'General Knowledge Quiz' LIMIT 1;
  IF v_quiz_id IS NULL THEN
    INSERT INTO quizzes (category_id, title, description, difficulty)
    VALUES (v_cat_id, 'General Knowledge Quiz', 'Test your general awareness', 'Easy')
    RETURNING id INTO v_quiz_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM questions WHERE quiz_id = v_quiz_id) THEN
    INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES
    (v_quiz_id, 'What is the capital of France?', '["London","Berlin","Paris","Madrid"]'::jsonb, 2, 'Paris is the capital city of France.'),
    (v_quiz_id, 'Which planet is known as the Red Planet?', '["Venus","Mars","Jupiter","Saturn"]'::jsonb, 1, 'Mars is called the Red Planet due to its reddish appearance.'),
    (v_quiz_id, 'Who painted the Mona Lisa?', '["Van Gogh","Picasso","Leonardo da Vinci","Michelangelo"]'::jsonb, 2, 'Leonardo da Vinci painted the Mona Lisa.'),
    (v_quiz_id, 'What is the largest ocean on Earth?', '["Atlantic","Indian","Arctic","Pacific"]'::jsonb, 3, 'The Pacific Ocean is the largest ocean on Earth.'),
    (v_quiz_id, 'In which year did World War II end?', '["1943","1944","1945","1946"]'::jsonb, 2, 'World War II ended in 1945.');
  END IF;
END $$;

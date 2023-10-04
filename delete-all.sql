SET SQL_SAFE_UPDATES = 0;
DELETE FROM rss.tokens WHERE id > 0;
DELETE FROM rss.users WHERE id > 0;
DELETE FROM rss.students WHERE id > 0;
DELETE FROM rss.courses WHERE id > 0;
DELETE FROM rss.assignments WHERE id > 0;
DELETE FROM rss.assignmentref WHERE id > 0;
DELETE FROM rss.student_course WHERE student > 0;
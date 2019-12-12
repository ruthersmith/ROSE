import sqlite3
db_conn = sqlite3.connect('example.db')
db_cursor = conn.cursor()

# Create table
db_cursor.execute('''CREATE TABLE HighScore
             (Rank interger, Name text, Score text)''')

# Insert a row of data
db_cursor.execute("INSERT INTO HighScore VALUES (1,\"ip man\",99999)")

# Save (commit) the changes
db_conn.commit()

# We can also close the connection if we are done with it.
# Just be sure any changes have been committed or they will be lost.
db_conn.close()

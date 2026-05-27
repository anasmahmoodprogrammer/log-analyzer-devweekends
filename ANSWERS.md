### 4. The `ANSWERS.md`

This document answers the specific questions outlined in the assessment criteria[cite: 5]. Place it in the repository root.

```markdown
# Log Analyzer - Answers

**1. How to run**
Ensure Node.js is installed. From the repository root, run: `node analyzer.js <path_to_log_file>`. To generate a test file first, run `node scripts/generate_logs.js`. No external dependencies (`npm install`) are required.

**2. Stack choice**
I chose pure Node.js. Given the requirement to parse potentially hundreds of thousands of log lines, Node's native `readline` module processes streams asynchronously with high I/O efficiency, avoiding loading the entire file into RAM. It is highly suited for data-intensive CLI tools while keeping the ecosystem familiar for full-stack engineering environments. 
A worse choice would be an inherently synchronous scripting language lacking efficient stream processing, or a heavy framework like Angular/React, which would introduce massive overhead for a strictly text-parsing backend task.

**3. One real edge case**
My code explicitly handles missing HTTP status codes replaced by a hyphen (`-`). 
*File and Line:* `analyzer.js`, Line 13. The regex captures `(\d{3}|-)`.
*Explanation:* If the logging system drops a status code and outputs a `-` instead, standard integer-matching regex `(\d{3})` would fail to parse the entire line, misclassifying valid traffic data as a malformed line. By anticipating this, the script maintains data integrity for endpoints and response times even when status codes fail.

**4. AI usage**
- Tool: Large Language Model (Gemini).
- Prompt: "Help me write a robust JavaScript regular expression to capture log lines shaped like: `2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 142ms`, keeping in mind the date format might change and extra fields might exist at the end."
- Change: The AI originally provided a strict ISO-8601 regex for the date. I modified it to `^(\S+(?:\s+\S+)?)` to ensure it lazily matches non-whitespace strings at the beginning of the line. This allows it to capture both strict ISO dates and bolted-on alternative date formats (like `2024/03/15 14:23:01`) without breaking the capture groups for the IP and Method.

**5. Honest gap**
Currently, the tool stores the total accumulated latency and request count for *every* unique endpoint in memory using a JavaScript object. If this tool were run against a massive file (e.g., hundreds of gigabytes) with millions of dynamically generated unique URL paths (like `/api/users/[uuid]`), the `stats.endpoints` object could grow infinitely, eventually causing a Node V8 Out-Of-Memory exception. 
With another day, I would fix this by implementing an external lightweight data store like Redis to handle aggregations during the stream, or pre-processing the paths to group RESTful IDs into a standard `/api/users/:id` format before storing them.
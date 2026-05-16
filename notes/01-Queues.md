# Async Job Queues (BullMQ + Redis)

**Learned while:** Building Loopkit report and PDF resume generation from LLM. 

## What it is
A Queue is a mechanism that is used to list the heavy computation tasks like PDF Generation, image generating, and sending an email, etc from our main server process. It purpose is to put the jobs that executes later. 
It basically unblocks the Request-response cycle, so the API can respond immediately without waiting for the work to finish. It operates on *Producer* - *Consumer* model. Producer push a job into the queue whereas the Consumer pulls the job from the queue and execute it in a separate process. These two processes are separated from each other. We need a datastore to store this queue. Most commmonly used is Redis which is used to store the queues and communicate between the producer and consumer. Redis is in-memory and very fast, which matters when you're constantly adding and pulling jobs.


## How it works

**The problem:**  
Loopkit generates a personalized report from the user's resume, job
description, and self-description. The LLM call takes ~30 seconds. If we
keep the user staring at a spinner, they may close the tab, refresh, or
lose connection — and we still pay for the tokens even though they
never get the result.

**The solution — async job queue:**

1. FE sends `POST /reports/generate` with resume + JD + self-description
2. BE creates a new Report document in MongoDB with `status: "pending"`
3. BE pushes a job to the `report-queue` (BullMQ + Upstash Redis) and
   immediately responds with `{ reportId, status: "pending" }` in ~50ms
4. FE navigates the user to the report page, which shows a "Generating..."
   state — the user is free to leave, refresh, or do something else
5. A **separate worker process** picks up the job from the queue, calls
   the LLM, and on success updates the Report document to
   `status: "completed"` with the generated content. On failure, it
   retries with exponential backoff, and after 3 attempts marks the
   report as `"failed"`.
6. FE polls `GET /reports/:reportId` every 3 seconds. When it sees
   `status: "completed"`, it renders the report.

## In one line (interview-ready)
In Loopkit, the report generation was taking around 30 seconds because of the LLM call, which meant users had to stare at a spinner — and if they refreshed or lost connection, the work was lost even though we'd already paid for the tokens. So I moved that work out of the HTTP request cycle into an async job queue using BullMQ and Redis. The API now creates a pending report, pushes a job to the queue, and responds in under 100 milliseconds. A separate worker process picks up the job, calls the LLM, and updates the report when it's done — with automatic retries on failure. The frontend just polls until the status flips to completed.
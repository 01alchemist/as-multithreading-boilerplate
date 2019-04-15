var jobId: i32 = 0

export class Job {
  constructor(
    public id: string,
    public iterations: i32,
    public startTime: i32,
    public duration: i32,
    public samples: i32,
    public width: i32,
    public height: i32,
    public xoffset: i32,
    public yoffset: i32
  ) {}
}

export function createJob(
  id: string,
  iterations: i32,
  startTime: i32,
  duration: i32,
  samples: i32,
  width: i32,
  height: i32,
  xoffset: i32,
  yoffset: i32
) {
  return new Job(
    id,
    iterations,
    startTime,
    duration,
    samples,
    width,
    height,
    xoffset,
    yoffset
  )
}

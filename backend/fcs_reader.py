import flowkit


def read_fcs(file_path):
      sample = flowkit.Sample(file_path)

      return {
         "file": file_path,
         "events": sample.event_count,
         "channels": sample.pnn_labels,
   }

if __name__ == "__main__": 
      result = read_fcs("test.fcs")
      print(result)
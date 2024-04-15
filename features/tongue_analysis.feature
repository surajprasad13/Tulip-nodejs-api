Feature: Tongue Analysis

  Background: 
    Given an actual tulip api
    Given an API with URI 'https://tulip-dev-computer-vision.cognitiveservices.azure.com/computervision/imageanalysis:analyze'

   # Scenario: generate tongue analysis report
  #   Given generate tongue analysis report

  # Scenario: computer statistics for tongue analysis
  #   Given data in 'tongue-data'
  #   Then there is statistics

  # Scenario: focus on tongue and get diagnosis
  #   Given the picture uploaded to Tongue Analysis with path '<image_path>'
  #   Then I can locate the tongue
  #   Then I can do a Tongue Analysis result that is not 'inconclusive'
  #   Given generate tongue analysis report
  #    Examples:
  #   | image_path |
  #    | features/tongue-data/5d0d816face5841966f64b6fe4098135-tongue-analysis-image-0.jpg |

      Scenario: test simply generating a report
    Given the picture uploaded to Tongue Analysis with folder '<image_path>'
    Then I can locate the tongue
    Then upload Tongue Analysis images
    Then generate tongue analysis report
     Examples:
    | image_path |
    # | features/tongue-data/8386680ba29511527fc6fdf795821238/tongue-analysis/image |  # all nice
    # | features/tongue-data/61486d29c5610f63decf1a995581ae8c/tongue-analysis/image |  # all nice
    # | features/tongue-data/40590d0bc497749c0251129b4bab277c/tongue-analysis/image |  # all nice
     #| features/tongue-data/528ed3cc77cf7c7ae163f9a9e98c2ef3/tongue-analysis/image |  # Didn't work prediction. Not well focused.
    #  | features/tongue-data/344ceb2946701d25dcaebd73ed0deb95/tongue-analysis/image | # Didn't work prediciton
      | features/tongue-data/77b94909c570f9b74c129a0f7a481e42/tongue-analysis/image | # Didn't work prediciton
    #  | features/tongue-data/37bd9eab0635d3aca1941b4bc0c7b038/tongue-analysis/image | # Didn't work segmentation
    #  | features/tongue-data/5d0d816face5841966f64b6fe4098135/tongue-analysis/image | # all nice

      
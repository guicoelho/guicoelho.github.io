
window.differ = new diff_match_patch()
angular.module('textEditor', ['firebase', 'ngSanitize'])
.value('fbURL', 'https://resplendent-inferno-285.firebaseio.com/text1')
.controller('EditorController', ['$scope', '$firebase', '$sce', function($scope, $firebase, $sce) {
    var refLive = new Firebase('https://resplendent-inferno-285.firebaseio.com/text1/live');
    var refVersions = new Firebase('https://resplendent-inferno-285.firebaseio.com/text1/versions');
    $scope.textHistory = $firebase(refVersions).$asArray();
    var liveNode = $firebase(refLive).$asObject();
    
    $scope.users = ['John Smith', 'Sarah Parker'];
    $scope.contexts = ['Edit', 'Review'];
    
    // Initialize
    refLive.once('value', function (snapshot) {
        $scope.currentText = snapshot.val();      
    });
    refLive.on('value', function (snapshot) {
      if(snapshot.getPriority() != $scope.user) {
        $scope.currentText = snapshot.val();        
      }      
    });

    // Last version I've seen
    refVersions.startAt('John Smith')
        .endAt('John Smith')
        .on('value', function(snapshot){
          if(snapshot.val() != null) {
            var snapshotObj = snapshot.val();
            var keys = Object.keys(snapshotObj);
            $scope.userLastVersion = snapshotObj[keys[keys.length-1]];            
          }
        });

    // Latest version
    refVersions.limit(1).on('value', function (snapshot) {
      if(snapshot.val() != null) {
        var snapshotObj = snapshot.val();
        var keys = Object.keys(snapshotObj);

        $scope.lastestVersionRef = new Firebase('https://resplendent-inferno-285.firebaseio.com/text1/versions/' + keys[0] + '/reviewed');

        $scope.lastestVersion = snapshotObj[keys[0]];        
      

      // Prompt review if there's a new, unreviewed version that is not mine
      var diffRelevant = ($scope.user != $scope.lastestVersion.user) && !$scope.lastestVersion.reviewed;
      if(diffRelevant) {
        var previousVersion = $scope.userLastVersion ? $scope.userLastVersion.content : '';
        var differences = window.differ.diff_main(previousVersion, $scope.lastestVersion.content);
        // Compute diff
        var textWithDifferences = "";
        differences.forEach(function(diff){
          switch(diff[0]){
            case -1:
              textWithDifferences += "<a class='del change'>" + diff[1] + "</a>";
              break;
            case 0:
              textWithDifferences += diff[1];
              break;
            case 1:
              textWithDifferences += "<a class='add change'>" + diff[1] + "</a>";
              break;                        
          }
        });
        $scope.textToRender = $sce.trustAsHtml(textWithDifferences);
        $scope.context = $scope.contexts[1];
        window.initializeTooltips();
      } else {
        $scope.context = $scope.contexts[0];
      }
        
      }
    }, function (errorObject) {
      console.log('The read failed: ' + errorObject.code);
    });

    $scope.updateLive = function() {
      // Setting live version
      console.log('LIVE: ' + $scope.currentText);
      refLive.setWithPriority($sce.getTrustedHtml($scope.currentText), $scope.user); 
    };

    $scope.markAsSeen = function() {
      console.log('save: ' + $scope.currentText);
      refVersions.push({content: $sce.getTrustedHtml($scope.currentText), user: $scope.user, reviewed: 1}).setPriority($scope.user); 
    };  

    $scope.markForReview = function() {
      console.log('save: ' + $scope.currentText);
      refVersions.push({content: $sce.getTrustedHtml($scope.currentText), user: $scope.user}).setPriority($scope.user); 
    };  

    $scope.markAsReviewed = function() {
      $scope.lastestVersionRef.set(1);
      $scope.context = $scope.contexts[0];
      $scope.markAsSeen();
      console.log($scope.lastestVersionRef);
      window.hideTooltips();
    };
    // var myVar = setInterval(function(){
    //   $scope.saveText();

    // }, 5000);


}])
.directive('contenteditable', ['$sce', function($sce) {
  return {
    restrict: 'A', // only activate on element attribute
    require: '?ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModel) {
      if(!ngModel) return; // do nothing if no ng-model

      // Specify how UI should be updated
      ngModel.$render = function() {
        element.html($sce.getTrustedHtml(ngModel.$viewValue) || '');
      };

      //Listen for change events to enable binding
      element.on('blur change', function() {
        scope.$apply(read);
      });
      element.on('keyup', function(){
        scope.$apply(read);
        scope.updateLive();
      });

      read(); // initialize

      // Write data to the model
      function read() {
        var html = element.html();
        // When we clear the content editable the browser leaves a <br> behind
        // If strip-br attribute is provided then we strip this out
        if( attrs.stripBr && html == '<br>' ) {
          html = '';
        }
        ngModel.$setViewValue(html);
      }
    }
  };
}]);



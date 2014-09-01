
window.differ = new diff_match_patch()

angular.module('textEditor', ['firebase', 'ngSanitize'])
 
.value('fbURL', 'https://resplendent-inferno-285.firebaseio.com/text1')

  .controller('EditorController', ['$scope', '$firebase', '$sce', function($scope, $firebase, $sce) {
    var ref = new Firebase('https://resplendent-inferno-285.firebaseio.com/text1');
    $scope.textHistory = $firebase(ref).$asArray();
    $scope.users = ['John Smith', 'Sarah Parker'];
    $scope.contexts = ['Edit', 'Review'];

    ref.startAt('John Smith')
        .endAt('John Smith')
        .once('value', function(snapshot){
          var snapshotObj = snapshot.val();
          var keys = Object.keys(snapshotObj);
          $scope.userLastVersion = snapshotObj[keys[keys.length-1]];
        });

    ref.limit(1).on('value', function (snapshot) {
      var snapshotObj = snapshot.val();
      var keys = Object.keys(snapshotObj);

      var lastestVersion = snapshotObj[keys[0]];

      console.log(lastestVersion.content);

      // Only show diffs if last save is not mine
      var diffRelevant = ($scope.user != lastestVersion.user) && lastestVersion.content != $scope.userLastVersion.content;
      console.log(diffRelevant);
      if(diffRelevant) {
        var differences = window.differ.diff_main($scope.userLastVersion.content, lastestVersion.content);
        console.log(differences);

        var textWithDifferences = "";

        differences.forEach(function(diff){
          switch(diff[0]){
            case -1:
              textWithDifferences += "<span class='del'>" + diff[1] + "</span>";
              break;
            case 0:
              textWithDifferences += diff[1];
              break;
            case 1:
              textWithDifferences += "<span class='add'>" + diff[1] + "</span>";
              break;                        
          }
        });
        $scope.textToRender = $sce.trustAsHtml(textWithDifferences);
        $scope.context = $scope.contexts[1];
      } else {
        $scope.context = $scope.contexts[0];
      }
      $scope.currentText = $sce.trustAsHtml(lastestVersion.content);

    }, function (errorObject) {
      console.log('The read failed: ' + errorObject.code);
    });

    $scope.saveText = function() {
      console.log('save: ' + $scope.currentText);
      ref.push({content: $sce.getTrustedHtml($scope.currentText), user: $scope.user}).setPriority($scope.user); 
    };

    $scope.hideDiff = function() {
      $scope.showDiff = false;
    }
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
        element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
      };

      // Listen for change events to enable binding
      element.on('blur keyup change', function() {
        scope.$apply(read);
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



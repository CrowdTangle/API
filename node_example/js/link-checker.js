var width = 1200;
var height = 800;
var padding = 1.5; // separation between same-color nodes
var clusterPadding = 6; // separation between different-color nodes
var maxRadius = 15;

// much of the code from https://bl.ocks.org/ctufts/f38ef0187f98c537d791d24fda4a6ef9

var color = d3.scale.ordinal()
      .range(["#55acee", "#357EBD", "#FF5700"]);


window.onload = function() {

  document.querySelector("#submit").addEventListener("click", function(e) {
    run();
  })

  if (document.querySelector("#search_box").value.length > 0) {
    run();
  }
};

function run() {
  document.querySelector(".graph").innerHTML = "Loading...";
  d3.json("/link-checker?link=" + document.querySelector("#search_box").value, function(err, data) {
      document.querySelector(".graph").innerHTML = "";
      draw(data);
  });
}

function draw(json) {
  console.log("got a response", json);
  var data = json.result.posts;
  var minRadius = 0;
  //unique cluster/group id's
  var cs = [];
  data.forEach(function(d){
    if (minRadius > d.score) {
      minRadius = d.score;
    }
    if(!cs.contains(d.platform)) {
      cs.push(d.platform);
    }
  });

  var n = data.length; // total number of nodes
  var m = cs.length; // number of distinct clusters

  //create clusters and nodes
  var clusters = new Array(m);
  var nodes = [];
  for (var i = 0; i < n; i++){
    nodes.push(create_nodes(data, i));
  }

  var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(.02)
    .charge(0)
    .on("tick", tick)
    .start();

  var svg = d3.select(".graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


  var node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("g")
    .on("click", function(d){
      var postUrl = d.data.postUrl;
      if (!postUrl) {
        postUrl = "https://twitter.com/" + d.data.account.platformId + "/status/" + d.data.platformId;
      }
      window.open(postUrl);
    }).call(force.drag);


  node.append("circle")
    .style("fill", function (d) {

      if (d.data.platform === 'Twitter') {
        return '#55acee';
      } else if (d.data.platform === 'Facebook') {
        return '#357EBD';
      } else {
        return '#FF5700';
      }
    })
    .attr("r", function(d){return d.radius});


  svg.selectAll("circle.node").on("click", function(){
           console.log(d3.select(this));
       });

  node.transition()
    .duration(750)
    .delay(function(d, i) { return i * 5; })
    .attrTween("r", function(d) {
      var i = d3.interpolate(0, d.radius);
      return function(t) { return d.radius = i(t); };
    });


  function create_nodes(data, node_counter) {
    var i = cs.indexOf(data[node_counter].platform);
    var r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius;
    var d = {
      cluster: i,
      radius: data[node_counter].score + Math.abs(minRadius),
      text: data[node_counter].score.toFixed(0) + "x",
      data: data[node_counter],
      link: data[node_counter].link,
      x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
      y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
    };

    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
    return d;
  };

  function tick(e) {
    node
      .each(cluster(10 * e.alpha * e.alpha))
      .each(collide(.5))
      .attr("transform", function (d) {
        var k = "translate(" + d.x + "," + d.y + ")";
        return k;
    });
  }

  // Move d to be adjacent to the cluster node.
  function cluster(alpha) {
    return function (d) {
      var cluster = clusters[d.cluster];
      if (cluster === d) return;
      var x = d.x - cluster.x;
      var y = d.y - cluster.y;
      var l = Math.sqrt(x * x + y * y);
      var r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  }

  // Resolves collisions between d and all other circles.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function (d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding);
      var nx1 = d.x - r;
      var nx2 = d.x + r;
      var ny1 = d.y - r;
      var ny2 = d.y + r;
      quadtree.visit(function (quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x;
          var y = d.y - quad.point.y;
          var l = Math.sqrt(x * x + y * y);
          var r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }
};

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

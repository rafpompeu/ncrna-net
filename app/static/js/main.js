$(document).ready(function() {
    $("#upload").click(function() {
        $("#load").append('<div id = "loading" class="spinner-border text-primary" style="top-100px" role="status"><span class="sr-only">Loading...</span></div>');
        var page = $("#upload").attr("name");
        var form_data = new FormData($("#upload-file")[0]);
        $.ajax({
            type: "POST",
            url: page,
            data: form_data,
            contentType: false,
            cache: false,
            processData: false,
            success: function(data) {
                var info = data["metrics basic"],
                    graph = data["network"],
                    table = data["table"],
                    mTable = data["metrics advanced"]["table"],
                    degree = data["metrics advanced"]["degree dist"],
                    betweenness = data["metrics advanced"]["betweenness dist"],
                    closeness = data["metrics advanced"]["closeness dist"],
                    clustering = data["metrics advanced"]["clustering dist"];



                $("#interaction").prop("checked", true);
                $("#metrics").prop("checked", true);
                $("#interaction,#metrics").change(function() {
                    var check = this.value;
                    if (check == "int") {
                        dataTable(table["header"], table["table"]);
                    } else {
                        metricsTable(mTable["header"], mTable["table"]);
                    }
                });
                metricsTable(mTable["header"], mTable["table"]);
                infoNet(info["number node"], info["number edges"], info["density"]);
                header(info["percentage"]);
                network(graph);
                degreeDist(degree["gene"], degree["ncrna"]);
                betweennessDist(betweenness["gene"], betweenness["ncrna"]);
                closenessDist(closeness["gene"], closeness["ncrna"]);
                clusteringDist(clustering["gene"], clustering["ncrna"]);

                $("#modal").modal("show");
                $(".spinner-border").remove();
            },
            error: function(request, status, error) {
                alert("ERRO!");
            }
        });
    });
});

function infoNet(num_node, num_edges, density) {
    $("#node_number").html(num_node);
    $("#edges_number").html(num_edges);
    $("#density").html(density);
}

function header(p_group) {
    d3.select("#header")
        .selectAll("div")
        .remove();
    for (i in p_group) {
        if (i == "Gene") {
            color = "rgb(31, 119, 180)";
        }
        if (i == "miRNA") {
            color = "rgb(174, 199, 232)";
        }

        if (i == "circRNA") {
            color = "rgb(255, 187, 120)";
        }
        if (i == "piRNA") {
            color = "rgb(152, 223, 138)";
        }

        var svg = d3
            .select("#header")
            .append("div")
            .append("svg")
            .attr("width", 150)
            .attr("height", 20);
        svg
            .append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 10)
            .attr("fill", color);

        svg
            .append("text")
            .attr("x", 22)
            .attr("y", 10)
            .text(i + " " + p_group[i])
            .style("font-size", "15px")
            .attr("alignment-baseline", "middle");
    }
}

function network(graph) {
    var width = "100%",
        height = "100%";
    d3.select("#network")
        .selectAll("svg")
        .remove();
    var svg = d3
        .select("#network")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(
            d3.zoom().on("zoom", function() {
                svg.attr("transform", d3.event.transform);
            })
        )
        .append("g");

    var simulation = d3
        .forceSimulation()
        .force(
            "link",
            d3
            .forceLink()
            .iterations(1)
            .id(function(d) {
                return d.id;
            })
        )
        .force("charge", d3.forceManyBody().strength(-100))
        .force("x", d3.forceX(500))
        .force("y", d3.forceY(250));

    var link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#999")
        .attr("stroke-opacity", "0.6");

    var node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter()
        .append("g");

    var circles = node
        .append("circle")
        .attr("r", 7)
        .attr("fill", function(d) {
            if (d.group == "gene") {
                return "rgb(31, 119, 180)";
            }
            if (d.group == "mirna") {
                return "rgb(174, 199, 232)";
            }
            if (d.group == "circrna") {
                return "rgb(255, 187, 120)";
            }
            if (d.group == "pirna") {
                return "rgb(152, 223, 138)";
            }
            if (d.group == "disease") {
                return "rgb(255,0,0)";
            }
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", "1.5px")
        .call(
            d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    var lables = node
        .append("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", "10px")
        .text(function(d) {
            if (d.group == "gene") {
                return d.id;
            }
        })
        .attr("x", 6)
        .attr("y", 3);

    node.append("title").text(function(d) {
        return d.id;
    });

    simulation.nodes(graph.nodes).on("tick", ticked);

    simulation.force("link").links(graph.links);

    function ticked() {
        link
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    d3.select("#saveButton").on("click", function() {
        var width = $("#network").width(),
            height = $("#network").height();

        var ima = d3
            .select("#network")
            .select("svg")
            .attr("width", width)
            .attr("height", height);

        var svgString = getSVGString(ima.node());

        svgString2Image(svgString, 2 * width, 2 * height, "png", save);

        function save(dataBlob, filesize) {
            saveAs(dataBlob, "network.png");
        }
    });

    function getSVGString(svgNode) {
        svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
        var cssStyleText = getCSSStyles(svgNode);
        appendCSS(cssStyleText, svgNode);

        var serializer = new XMLSerializer();
        var svgString = serializer.serializeToString(svgNode);
        svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink=");
        svgString = svgString.replace(/NS\d+:href/g, "xlink:href");

        return svgString;

        function getCSSStyles(parentElement) {
            var selectorTextArr = [];

            selectorTextArr.push("#" + parentElement.id);
            for (var c = 0; c < parentElement.classList.length; c++)
                if (!contains("." + parentElement.classList[c], selectorTextArr))
                    selectorTextArr.push("." + parentElement.classList[c]);

            var nodes = parentElement.getElementsByTagName("*");
            for (var i = 0; i < nodes.length; i++) {
                var id = nodes[i].id;
                if (!contains("#" + id, selectorTextArr))
                    selectorTextArr.push("#" + id);

                var classes = nodes[i].classList;
                for (var c = 0; c < classes.length; c++)
                    if (!contains("." + classes[c], selectorTextArr))
                        selectorTextArr.push("." + classes[c]);
            }

            var extractedCSSText = "";
            for (var i = 0; i < document.styleSheets.length; i++) {
                var s = document.styleSheets[i];

                try {
                    if (!s.cssRules) continue;
                } catch (e) {
                    if (e.name !== "SecurityError") throw e; // for Firefox
                    continue;
                }

                var cssRules = s.cssRules;
                for (var r = 0; r < cssRules.length; r++) {
                    if (contains(cssRules[r].selectorText, selectorTextArr))
                        extractedCSSText += cssRules[r].cssText;
                }
            }

            return extractedCSSText;

            function contains(str, arr) {
                return arr.indexOf(str) === -1 ? false : true;
            }
        }

        function appendCSS(cssText, element) {
            var styleElement = document.createElement("style");
            styleElement.setAttribute("type", "text/css");
            styleElement.innerHTML = cssText;
            var refNode = element.hasChildNodes() ? element.children[0] : null;
            element.insertBefore(styleElement, refNode);
        }
    }

    function svgString2Image(svgString, width, height, format, callback) {
        var format = format ? format : "png";

        var imgsrc =
            "data:image/svg+xml;base64," +
            btoa(unescape(encodeURIComponent(svgString)));

        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        var image = new Image();
        image.onload = function() {
            context.clearRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            canvas.toBlob(function(blob) {
                var filesize = Math.round(blob.length / 1024) + " KB";
                if (callback) callback(blob, filesize);
            });
        };

        image.src = imgsrc;
    }
}

function degreeDist(gene, ncrna) {
    $("#chart0").append('<div id="degreeDist" class="col-11"></div>');
    Highcharts.chart("degreeDist", {
        chart: {
            type: "scatter",
            zoomType: "xy"
        },
        title: {
            text: "Degree in network"
        },
        subtitle: {
            text: ""
        },
        xAxis: {
            title: {
                enabled: true,
                text: "Degree"
            }
        },
        yAxis: {
            title: {
                text: "Frequency"
            }
        },
        legend: {
            layout: "vertical",
            align: "left",
            verticalAlign: "top",
            x: 100,
            y: 70,
            floating: true,
            backgroundColor:
                (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
                "#FFFFFF",
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: "rgb(100,100,100)"
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: "<b>{series.name}</b><br>",
                    pointFormat: "Degree: {point.x}, Frequency: {point.y}"
                }
            }
        },
        series: [{
                name: "ncRNA",
                color: "rgba(223, 83, 83, .5)",
                data: ncrna
            },

            {
                name: "Gene",
                color: "rgba(119, 152, 191, .5)",
                data: gene
            }
        ]
    });
}

function betweennessDist(gene, ncrna) {
    $("#chart1").append('<div id="betweennessDist" class="col-11"></div>');

    Highcharts.chart("betweennessDist", {
        chart: {
            type: "scatter",
            zoomType: "xy"
        },
        title: {
            text: "Betweenness in network"
        },
        subtitle: {
            text: ""
        },
        xAxis: {
            title: {
                enabled: true,
                text: "betweenness"
            }
        },
        yAxis: {
            title: {
                text: "Frequency"
            }
        },
        legend: {
            layout: "vertical",
            align: "left",
            verticalAlign: "top",
            x: 100,
            y: 70,
            floating: true,
            backgroundColor:
                (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
                "#FFFFFF",
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: "rgb(100,100,100)"
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: "<b>{series.name}</b><br>",
                    pointFormat: "Betweenness: {point.x}, Frequency: {point.y}"
                }
            }
        },
        series: [{
                name: "ncRNA",
                color: "rgba(223, 83, 83, .5)",
                data: ncrna
            },

            {
                name: "Gene",
                color: "rgba(119, 152, 191, .5)",
                data: gene
            }
        ]
    });
}

function closenessDist(gene, ncrna) {
    $("#chart2").append('<div id="closenessDist" class="col-11"></div>');

    Highcharts.chart("closenessDist", {
        chart: {
            type: "scatter",
            zoomType: "xy"
        },
        title: {
            text: "Closeness in network"
        },
        subtitle: {
            text: ""
        },
        xAxis: {
            title: {
                enabled: true,
                text: "Closeness"
            }
        },
        yAxis: {
            title: {
                text: "Frequency"
            }
        },
        legend: {
            layout: "vertical",
            align: "left",
            verticalAlign: "top",
            x: 100,
            y: 70,
            floating: true,
            backgroundColor:
                (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
                "#FFFFFF",
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: "rgb(100,100,100)"
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: "<b>{series.name}</b><br>",
                    pointFormat: "Closeness: {point.x}, Frequency: {point.y}"
                }
            }
        },
        series: [{
                name: "ncRNA",
                color: "rgba(223, 83, 83, .5)",
                data: ncrna
            },

            {
                name: "Gene",
                color: "rgba(119, 152, 191, .5)",
                data: gene
            }
        ]
    });
}

function clusteringDist(gene, ncrna) {
    $("#chart3").append('<div id="clusteringDist" class="col-11"></div>');

    Highcharts.chart("clusteringDist", {
        chart: {
            type: "scatter",
            zoomType: "xy"
        },
        title: {
            text: "Clustering in network"
        },
        subtitle: {
            text: ""
        },
        xAxis: {
            title: {
                enabled: true,
                text: "Clustering"
            }
        },
        yAxis: {
            title: {
                text: "Frequency"
            }
        },
        legend: {
            layout: "vertical",
            align: "left",
            verticalAlign: "top",
            x: 100,
            y: 70,
            floating: true,
            backgroundColor:
                (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
                "#FFFFFF",
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: "rgb(100,100,100)"
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: "<b>{series.name}</b><br>",
                    pointFormat: "Clustering: {point.x}, Frequency: {point.y}"
                }
            }
        },
        series: [{
                name: "ncRNA",
                color: "rgba(223, 83, 83, .5)",
                data: ncrna
            },

            {
                name: "Gene",
                color: "rgba(119, 152, 191, .5)",
                data: gene
            }
        ]
    });
}

function dataTable(header, table) {
    $("#DataTable_wrapper").remove();
    $("#table").append(
        '<table id="DataTable" class="table table-striped table-bordered" style="width:100%"></table>'
    );
    $("#DataTable").DataTable({
        bDestroy: true,
        dom: "Bfrtip",
        buttons: ["csv", "excel", "pdf"],
        columns: header,
        data: table
    });
}

function metricsTable(header, table) {
    $("#DataTable_wrapper").remove();
    $("#table").append(
        '<table id="DataTable" class="table table-striped table-bordered" style="width:100%"></table>'
    );
    $("#DataTable").DataTable({
        bDestroy: true,
        dom: "Bfrtip",
        buttons: ["csv", "excel", "pdf"],
        columns: header,
        data: table
    });
}
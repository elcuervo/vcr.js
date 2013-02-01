require "rack/cors"

use Rack::Cors do
  allow do
    origins '*'
    resource '*', :headers => :any, :methods => [:get, :post, :options]
  end
end

run Rack::Static.new @app, urls: [""], root: '.', index: 'index.html'

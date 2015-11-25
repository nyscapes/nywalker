# encoding: utf-8

require "sinatra/base"
require "sinatra/assetpack"
require "sinatra/flash"
require "mustache/sinatra"
require "sinatra-health-check"
require "googlebooks"
require "active_support" # for the slug.
require "active_support/inflector"
require "active_support/core_ext/array/conversions"
# require "georuby"
# require "geo_ruby/ewk"

require_relative "./model"

class App < Sinatra::Base
  enable :sessions
  if Sinatra::Base.development?
    set :session_secret, "supersecret"
  end
  base = File.dirname(__FILE__)
  set :root, base

  register Sinatra::AssetPack
  register Sinatra::Flash
  register Mustache::Sinatra

  assets do
    serve "/js",    from: "app/js"
    serve "/css",   from: "app/css"
    # serve "/img",   from: "app/img"

    css :app_css, [ "/css/*.css" ]
    js :app_js, [
      "/js/*.js"#,
      # "/js/vendor/*.js"
    ]

  end

  require "#{base}/app/helpers"
  require "#{base}/app/views/layout"

  set :mustache, {
    :templates => "#{base}/app/templates",
    :views => "#{base}/app/views",
    :namespace => App
  }

  before do
    @admin = true
    @user = User.first
    @css = css :app_css
    @js  = js  :app_js
    @path = request.path_info
    @rendered_flash = rendered_flash(flash)
    @checker = SinatraHealthCheck::Checker.new
  end

  helpers do

    def save_object(object, path)
      begin
        object.save
        flash[:success] = "#{object.class} successfully saved!"
        redirect path
      rescue DataMapper::SaveFailureError => e
        dm_error_and_redirect(object, path)
			rescue StandardError => e
				mustache :error_report, locals: { e: e }
      end
    end

    def dm_error_and_redirect(object, path, error = "")
      error = object.errors.values.join(', ') if error == ""
      flash[:error] = "Error: #{error}"
      redirect path
    end

    def slugify(string)
      string = string.parameterize.underscore
    end

    def book
      @book ||= Book.first(slug: params[:book_slug]) || halt(404)
    end

    def place
      @place ||= Place.first(slug: params[:place_slug]) || halt(404)
    end

  end

  # Function allows both get / post.
  def self.get_or_post(path, opts={}, &block)
    get(path, opts, &block)
    post(path, opts, &block)
  end

  get "/" do
    @page_title = "Home"
    mustache :index
  end

  get "/places/new" do
    @page_title = "Add New Place"
    mustache :place_new
  end

  post "/places/add" do
    new_place = Place.new
    new_place.attributes = { name: params[:name], lat: params[:lat], lon: params[:lon], source: params[:source], confidence: params[:confidence], user: @user, added_on: Time.now, what3word: params[:w3w] }
    if new_place.source == "GeoNames"
      new_place.bounding_box_string = params[:bbox]
      new_place.geonameid = params[:geonameid]
    end
    new_place.slug = slugify new_place.name
    # new_place.geom = GeoRuby::SimpleFeatures::Point.from_x_y(new_place.lon, new_place.lat, 4326)
    # create_bounding_box(place) # because this doesn't seem to work.
    begin
      new_place.save
      Nickname.first_or_create(name: new_place.name, place: new_place)
      if params[:form_source] == "modal"
        @place = new_place
        mustache :modal_place_saved, { layout: :naked }
      else
        flash[:success] = "#{new_place.name} successfully saved!"
        redirect "/places/#{new_place.slug}"
      end
    rescue DataMapper::SaveFailureError => e
      mustache :error_report, locals: { e: e, validation: new_place.errors.values.join(', ') }
    rescue StandardError => e
      mustache :error_report, locals: { e: e }
    end
  end

  post "/search-place" do
    geonames_username = "moacir" # This should be changed
    @search_term = params[:search] # needed for mustache.
    query = "http://api.geonames.org/searchJSON?username=#{geonames_username}&style=full&q=#{@search_term}"
    query << "&countryBias=US" if params[:us_bias] == "on"
    query << "&south=40.48&west=-74.27&north=40.9&east=-73.72" if params[:nyc_limit] == "on"
    results = JSON.parse(HTTParty.get(query).body)["geonames"]
    if results.length == 0
      @results = nil
    else
      @results = results[0..4].map{|r| {name: r["toponymName"], lat: r["lat"], lon: r["lng"], description: r["fcodeName"], geonameid: r["geonameId"], bbox: get_bbox(r["bbox"]) } }
    end
    mustache :search_results, { layout: :naked }
  end

  get "/books/new" do
    @page_title = "Add New Book"
    mustache :book_new
  end

  post "/books/new" do
    @page_title = "Adding ISBN: #{params[:isbn]}"
    result = GoogleBooks.search("isbn:#{params[:isbn]}").first
    unless result.nil?
      @new_book = { author: result.authors,
                    title: result.title,
                    year: result.published_date[0..3],
                    last_page: result.page_count,
                    cover: result.image_link,
                    link: result.info_link }
    else
      # clumsy kludge for when GoogleBooks returns nothing
      @new_book = { author: "AUTHOR NOT FOUND",
                    title: "TITLE NOT FOUND",
                    year: "",
                    last_page: "",
                    cover: nil,
                    link: "" }
    end
    @isbn = params[:isbn] # sometimes google doesn't return one.
    mustache :book_new_post
  end

  post "/add-book" do
    @page_title = "Saving #{params[:title]}"
    saved_book = Book.new
    saved_book.attributes = { author: params[:author], title: params[:title], isbn: params[:readonlyISBN], cover: params[:cover], url: params[:link], year: params[:year], users: [@user], slug: slugify("#{params[:title][0..45]}_#{params[:year]}"), added_on: Time.now }
    save_object(saved_book, "/books/#{saved_book.slug}")
  end

  get "/books/:book_slug" do
    @page_title = "#{book.title}"
    @instances = Instance.all(book: book, order: [:page.asc, :sequence.asc]) # place.instances doesn't work?
    mustache :book_show
  end

  get "/books" do
    @page_title = "All Books"
    @books = Book.all
    mustache :books_show
  end

  get "/books/:book_slug/instances/new" do
    @page_title = "New Instance for #{book.title}"
    @last_instance = Instance.last(user: @user, book: book)
    @nicknames = Nickname.map{|n| "#{n.name} - {#{n.place.name}}"}
    mustache :instance_new
  end

  post "/books/:book_slug/instances/new" do
    @page_title = "Saving Instance for #{book.title}"
    instance = Instance.new
    instance.attributes = { page: params[:page], sequence: params[:sequence], text: params[:place_name_in_text], added_on: Time.now, user: @user, book: book }
    if params[:place].match(/{.*}$/)
      place = params[:place].match(/{.*}$/)[0].gsub(/{/, "").gsub(/}/, "")
    else
      dm_error_and_redirect(instance, request.path, "The place did not have a name coded inside {}s")
    end
    location = Place.first(name: place)
    if location.nil?
      dm_error_and_redirect(instance, request.path, "No such place found. Please add it below.")
    end
    instance.place = location
    Nickname.first_or_create(name: instance.text, place: location)
    save_object(instance, request.path)
  end

  get "/places" do
    @page_title = "All places"
    @places = Place.all
    mustache :places_show
  end

  get "/places/:place_slug" do
    @page_title = "#{place.name}"
    @books = Book.all(instances: Instance.all(place: place))
    mustache :place_show
  end

  post "/places/:place_slug/edit" do
    @page_title = "Editing #{place.name}"
    if place.update( name: params[:name], lat: params[:lat], lon: params[:lon], confidence: params[:confidence], source: params[:source], geonameid: params[:geonameid], bounding_box_string: params[:bounding_box_string] )
      flash[:success] = "#{place.name} has been updated"
      '<script>$("#editPlaceModal").modal("hide");window.location.reload();</script>'
    else
      flash[:error] = "Something went wrong."
      mustache :place_edit, { layout: :naked }
    end
  end

  get "/about" do
    @page_title = "About"
    mustache :about
  end

  def get_bbox(bbox)
    if bbox.class == Hash
      [bbox["east"], bbox["south"], bbox["north"], bbox["west"]].to_s
    end
  end

  def create_bounding_box(place)
    # This doesn't actually seem to build a useful polygon.
    place.bounding_box = BoundingBox.new
    if place.bounding_box_string =~ /^\[.*\]$/
      bbox = place.bounding_box_string.gsub(/^\[/, "").gsub(/\]$/, "").split(", ")
      # place.bounding_box.geom = GeoRuby::SimpleFeatures::Polygon.from_coordinates([
      #   [ bbox[0], bbox[1] ],
      #   [bbox[0], bbox[2]],
      #   [bbox[3], bbox[2]],
      #   [bbox[3], bbox[1]]
      # ], 4326)
    else
      # place.bounding_box.geom = nil
    end
    place.save
  end

  def rendered_flash(flash)
    # doing just @flash = flash and then handling the flash rendering
    # inside mustache created a kind of persistence for the flash
    # messages, wholly ruining the point of the flash message in the
    # first place. 
    string = ""
    if flash == {} || flash.nil?
      string
    else
      flash.each do |type, message|
        string << "<div class='alert #{bootstrap_class_for type} fade in'>"
        string << "<button class='close' data-dismiss='alert'>&times;</button>"
        string << message
        string << "</div>"
      end
      string
    end
  end

  def bootstrap_class_for flash_type
    { success: "alert-success", error: "alert-danger", alert: "alert-warning", notice: "alert-info" }[flash_type] || flash_type.to_s
  end

  get "/internal/health" do
    if @checker.healthy?
      "healthy"
    else
      status 503
      "unhealthy"
    end
  end

  get "/internal/status" do
    headers 'content-type' => 'application/json'
    @checker.status.to_json
  end

  not_found do
    if request.path =~ /\/$/
      redirect request.path.gsub(/\/$/, "")
    else
      status 404
    end
  end

end

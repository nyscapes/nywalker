class App

  # ALL

  get "/places" do
    @page_title = "All places"
    @places = Place.all.sort_by{ |place| place.instances.count }.reverse
    mustache :places_show
  end

  get "/places/by-name" do
    @page_title = "All places"
    @places = Place.order(:name).all
    mustache :places_show
  end
  
  get "/places/flagged" do
    @page_title = "All flagged places"
    @places = Place.where(:flagged).all
    mustache :places_show
  end

  # CREATE

  get "/places/new" do
    protected_page
    @page_title = "Add New Place"
    mustache :place_new
  end

  post "/places/add" do
    protected_page
    new_place = Place.new
    new_place.set( name: params[:name].gsub(/\s+$/, ""), lat: params[:lat], lon: params[:lon], source: params[:source].gsub(/\s+$/, ""), confidence: params[:confidence], user: @user, added_on: Time.now, what3word: params[:w3w], slug: params[:name].gsub(/\s+$/, "").to_url, note: params[:note] )
    if new_place.source == "GeoNames"
      new_place.bounding_box_string = params[:bbox]
      new_place.geonameid = params[:geonameid]
    end
    if new_place.lat == "" && new_place.lon == ""
      new_place.lat = nil
      new_place.lon = nil
      new_place.confidence = 0
    # else
    #   new_place.geom = make_point_geometry(new_place.lat, new_place.lon)
    end
    begin
      new_place.save
      new_nick = Nickname.create(name: new_place.name, place: new_place, instance_count: 0)
      settings.nicknames_list << { string: new_nick.list_string, instance_count: 0 }
      if params[:form_source] == "modal"
        @place = new_place
        mustache :modal_place_saved, { layout: :naked }
      else
        flash[:success] = "#{new_place.name} successfully saved!"
        redirect "/places/#{new_place.slug}"
      end
    rescue Sequel::ValidationFailed => @e
      @error_text = new_place.errors.map{ |key, value| "#{key} #{value.map{ |v| v }.join(',')}" }.to_sentence
      # if @error_text =~ /Slug is already taken/
      #   @error_text = "Place name “#{new_place.slug}” is already in use. Are you sure it’s not in the database?"
      mustache :error
    rescue StandardError => @e
      mustache :error
    end
  end

  post "/search-place" do
    protected_page
    @search_term = params[:search] # needed for mustache.
    query = "http://api.geonames.org/searchJSON?username=#{ENV['GEONAMES_USERNAME']}&style=full&q=#{@search_term}"
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

  # READ

  get "/places/:place_slug" do
    @page_title = "#{place.name}"
    @books = Instance.where(place: place).all.map{ |i| i.book }.uniq
    if place.flagged
      @flags = Flag.where(object_type: "place").where(object_id: place.id).all
    end
    mustache :place_show
  end

  # UPDATE

  post "/places/:place_slug/edit" do
    protected_page
    @page_title = "Editing #{place.name}"
    if place.update( name: params[:name].gsub(/\s+$/, ""), lat: params[:lat], lon: params[:lon], confidence: params[:confidence], source: params[:source].gsub(/\s+$/, ""), geonameid: params[:geonameid], bounding_box_string: params[:bounding_box_string], what3word: "", note: params[:note], geom: make_point_geometry(params[:lat], params[:lon]) )
      flash[:success] = "#{place.name} has been updated"
      '<script>$("#editPlaceModal").modal("hide");window.location.reload();</script>'
    else
      flash[:error] = "Something went wrong."
      mustache :place_edit, { layout: :naked }
    end
  end

  post "/places/:place_slug/unflag" do
    protected_page
    @page_title = "Unflagging #{place.name}"
    if place.update(flagged: false)
      flash[:success] = "#{place.name} has been untagged"
      redirect back
    else
      flash[:error] = "Something went wrong."
      mustache :place_edit, { layout: :naked }
    end
  end
 
  # DESTROY

  post "/places/:place_slug/delete" do
    protected_page
    if place.instances.length > 0
      "<script>alert('Cannot delete #{place.name}, as it has instances');</script>"
    else
      puts "Deleting Place #{place.id}"
      if place.demolish!
        puts "Deleted #{place.name}"
        flash[:success] = "Deleted place #{place.name}"
        redirect "/places/"
      else
        puts "Failed to delete #{place.name}"
        flash[:error] = "Unable to delete place #{place.name}"
        redirect back
      end
    end
  end

  # SEARCH
  
  post "/places/search-duplicates" do
    protected_page
    place_slug = params[:name].gsub(/\s+$/, "").to_url
    if Place.where(slug: place_slug).count > 0 
      content_type 'application/json'
      { slug: place_slug }.to_json
    else
      content_type 'application/json'
      { slug: false }.to_json
    end
  end

  # METHODS
  
  def make_point_geometry(lat, lon)
    GeoRuby::SimpleFeatures::Point.from_x_y(lon, lat, 4326)
  end

end

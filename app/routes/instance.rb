class App

  # ALL

  get "/instances/flagged" do
    # permitted_page("all")
    @page_title = "All Flagged Instances"
    @instances = Instance.all(flagged: true)
    mustache :instances_show
  end

  # CREATE

  get "/books/:book_slug/instances/new" do
    permitted_page(book)
    @page_title = "New Instance for #{book.title}"
    @last_instance = Instance.last(user: @user, book: book) || Instance.last(book: book)
    @nicknames = Nickname.map{|n| "#{n.name} -- {#{n.place.name}}"}
    mustache :instance_new
  end

  post "/books/:book_slug/instances/new" do
    protected_page
    @page_title = "Saving Instance for #{book.title}"
    instance = Instance.new
    special = special_field(params)
    instance.attributes = { page: params[:page], sequence: params[:sequence], text: params[:place_name_in_text].gsub(/\s+$/, ""), added_on: Time.now, user: @user, book: book, note: params[:note], special: special }
    if params[:place].match(/{.*}$/)
      place = params[:place].match(/{.*}$/)[0].gsub(/{/, "").gsub(/}/, "")
    else
      dm_error_and_redirect(instance, request.path, "The place did not have a name coded inside {}s")
    end
    location = Place.first(name: place)
    if location.nil?
      dm_error_and_redirect(instance, request.path, "No such place found. Please add it below.")
    end
    if instance.text.nil? || instance.text == ""
      dm_error_and_redirect(instance, request.path, "The “Place name in text” was left blank.")
    else
      Nickname.first_or_create(name: instance.text, place: location)
    end
    instance.place = location
    Instance.all(book: book, page: instance.page, :sequence.gte => instance.sequence).each do |other_instance|
      other_instance.update(sequence: other_instance.sequence + 1)
    end
    save_object(instance, back)
  end

  # READ

  get "/books/:book_slug/instances/:instance_id" do
    @page_title = "Instance #{instance.id} for #{book.title}"
    @instances = Instance.all(book: book, order: [:page.asc, :sequence.asc])
    index = @instances.index instance
    @previous_instance = @instances[index - 1] unless index == 0
    @next_instance = @instances[index + 1] unless index == @instances.count - 1
    mustache :instance_show
  end

  # UPDATE

  get "/books/:book_slug/instances/:instance_id/edit" do
    permitted_page(instance)
    @page_title = "Editing Instance #{instance.id} for #{book.title}"
    @nicknames = Nickname.map{|n| "#{n.name} -- {#{n.place.name}}"}
    mustache :instance_edit
  end

  post "/books/:book_slug/instances/:instance_id/edit" do
    protected_page
    instance.attributes = { page: params[:page], sequence: params[:sequence], text: params[:place_name_in_text].gsub(/\s+$/, ""), modified_on: Time.now, user: @user, book: book, note: params[:note], special: special } 
    if params[:place].match(/{.*}$/) # We've likely modified the place.
      instance.place = Place.first name: params[:place].match(/{.*}$/)[0].gsub(/{/, "").gsub(/}/, "")
    end
    Nickname.first_or_create(name: instance.text, place: instance.place)
    save_object(instance, "/books/#{book.slug}") 
  end

  # DESTROY

  post "/books/:book_slug/instances/:instance_id/delete" do
    protected_page
    puts "Deleting Instance #{instance.id} for #{book.title}"
    page_instances = Instance.all(book: book, page: instance.page, :sequence.gt => instance.sequence)
    if instance.destroy
      page_instances.each do |other_instance|
        other_instance.update(sequence: other_instance.sequence - 1)
      end
      flash[:success] = "Deleted instance #{instance.id}."
      redirect "/books/#{book.slug}"
    else
      flash[:error] = "Something went wrong."
      redirect "/books/#{book.slug}"
    end
  end

  # METHODS

  def special_field(params)
    if params[:special]
      params[:special].gsub(/\s+$/, "")
    else
      nil
    end
  end

end
